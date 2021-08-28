/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

// @ts-check
const fs = require('fs');
const util = require('util');
const path = require('path');
const _ = require('lodash');
const chalk = require('chalk');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

class SyncTool {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      's3-sync': {
        usage: 'Syncs files to S3',
        lifecycleEvents: ['sync'],
      },
    };

    this.cli = {
      log(prefix = '', message) {
        serverless.cli.consoleLog(`[serverless-sync-to-s3] ${prefix} ${chalk.yellowBright(message)}`);
      },
      warn(prefix = '', message) {
        serverless.cli.consoleLog(`[serverless-sync-to-s3] ${prefix} ${chalk.redBright(message)}`);
      },
    };

    this.hooks = {
      'after:deploy:deploy': async () => {
        if (options.nosync) {
          return null;
        }
        return this.sync.bind(this)();
      },
      's3-sync:sync': this.sync.bind(this),
    };
  }

  s3() {
    const provider = this.serverless.getProvider('aws');
    let awsCredentials;
    let region;
    if (
      provider.cachedCredentials &&
      provider.cachedCredentials.accessKeyId &&
      provider.cachedCredentials.secretAccessKey &&
      provider.cachedCredentials.sessionToken
    ) {
      region = provider.getRegion();
      awsCredentials = {
        accessKeyId: provider.cachedCredentials.accessKeyId,
        secretAccessKey: provider.cachedCredentials.secretAccessKey,
        sessionToken: provider.cachedCredentials.sessionToken,
      };
    } else {
      region = provider.getCredentials().region;
      awsCredentials = provider.getCredentials().credentials;
    }
    return new provider.sdk.S3({
      region,
      credentials: awsCredentials,
    });
  }

  /**
   * Get a list of all files in a directory
   * @param {string} localPath
   */
  async _listLocalFiles(localPath) {
    const cwd = process.cwd();
    const sourcePath = path.isAbsolute(localPath) ? localPath : path.join(cwd, localPath);

    const rawFiles = await readdir(sourcePath);
    const files = rawFiles.map(f => path.join(localPath, f));

    // enrich with stats
    /** @type {(file: string) => Promise<[string, fs.Stats]>} */
    const getStats = async file => [file, await stat(file)];
    const filesWithStats = await Promise.all(files.map(getStats));

    /** @type {string[]} */
    const directoryFiles = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const f of filesWithStats) {
      /** @type {[file: string, stats: fs.Stats]} */
      const [file, stats] = f;
      if (stats.isDirectory()) {
        // eslint-disable-next-line no-await-in-loop
        directoryFiles.push(...(await this._listLocalFiles(file)));
      } else {
        directoryFiles.push(file);
      }
    }
    return directoryFiles;
  }

  /**
   * List objects in a bucket
   * @param {{bucket: string, prefix: string, s3: Object}} params
   */
  async _listObjects({ bucket, prefix, s3 }) {
    const params = {
      Bucket: bucket,
      MaxKeys: 980,
      Prefix: prefix,
    };

    /** @type {{key: string, bucket: string, relativePath: string, filename: string}[]} */
    const result = [];
    let data;
    do {
      data = await s3.listObjectsV2(params).promise(); // eslint-disable-line no-await-in-loop
      params.ContinuationToken = data.NextContinuationToken;
      const prefixSlash = _.endsWith(prefix, '/') ? prefix : `${prefix}/`;

      _.forEach(data.Contents, item => {
        // eslint-disable-line no-loop-func
        if (item.Key === prefixSlash) return;
        if (_.endsWith(item.Key, '/')) return;

        result.push({
          key: item.Key,
          bucket,
          relativePath: item.Key.substring(prefixSlash.length),
          filename: path.basename(item.Key),
        });
      });
    } while (params.ContinuationToken);

    return result;
  }

  /**
   * Deletes objects from the bucket
   * @param {{bucket: string, items: {Key: string}[], s3: Object}} params
   */
  async _deleteObjects({ bucket, items, s3 }) {
    const batches = _.chunk(items, 900);
    // eslint-disable-next-line no-restricted-syntax
    for (const batch of batches) {
      const deletionResponses = await s3.deleteObjects({ Bucket: bucket, Delete: { Objects: batch } }).promise(); // eslint-disable-line no-await-in-loop
      if (deletionResponses.Errors.length) {
        throw new Error(`Failed to delete objects in bucket ${bucket}`);
      }
    }
  }

  /**
   * Uploads objects to S3.
   * @param {{s3: Object, messagePrefix: string, bucketName: string, bucketPrefix: string, files: string[], localDir: string}} params
   */
  async _uploadObjects({ s3, messagePrefix, bucketName, bucketPrefix, files, localDir }) {
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      const relativeFilePath = file.substring(localDir.length);
      const s3Prefix = bucketPrefix.endsWith('/')
        ? `${bucketPrefix}${relativeFilePath}`
        : `${bucketPrefix}/${relativeFilePath}`;

      // TODO: Optimise by not uploading files that haven't changed.
      this.cli.log(messagePrefix, `Uploading ${file} to s3://${bucketName}/${s3Prefix}`);
      const stream = fs.createReadStream(file);
      // eslint-disable-next-line no-await-in-loop
      await s3
        .upload(
          {
            Bucket: bucketName,
            Key: s3Prefix,
            Body: stream,
          },
          { partSize: 5 * 1024 * 1024, queueSize: 5 },
        )
        .promise();
    }
  }

  async sync() {
    /** @type {{bucketName: string, bucketPrefix: string, localDir: string}[]} */
    const syncDirs = this.serverless.service.custom.s3Sync;
    const messagePrefix = 'sync: ';

    if (!syncDirs) {
      this.cli.log(messagePrefix, `No sync configuration`);
      return;
    }

    const s3 = this.s3();

    // eslint-disable-next-line no-restricted-syntax
    for (const syncDir of syncDirs) {
      const { bucketName, bucketPrefix, localDir: rawLocalDir } = syncDir;
      const localDir = rawLocalDir.endsWith(path.sep) ? rawLocalDir : `${rawLocalDir}${path.sep}`;

      // eslint-disable-next-line no-await-in-loop
      const files = await this._listLocalFiles(localDir);

      // eslint-disable-next-line no-await-in-loop
      const s3Files = await this._listObjects({ s3, bucket: bucketName, prefix: bucketPrefix });

      const relativeFilePaths = files.map(f => f.substring(localDir.length));

      const filesToRemoveFromBucket = s3Files.filter(({ relativePath }) => !relativeFilePaths.includes(relativePath));

      this.cli.log(messagePrefix, `Deleting ${filesToRemoveFromBucket.length} files from ${bucketName}`);
      // eslint-disable-next-line no-await-in-loop
      await this._deleteObjects({
        s3,
        bucket: bucketName,
        items: filesToRemoveFromBucket.map(({ key }) => ({ Key: key })),
      });

      // eslint-disable-next-line no-await-in-loop
      await this._uploadObjects({ s3, messagePrefix, files, localDir, bucketName, bucketPrefix });
    }

    this.cli.log(messagePrefix, `Sync complete`);
  }
}

module.exports = SyncTool;
