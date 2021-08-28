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

import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import aws from 'aws-sdk';
import shell from 'shelljs';
import chokidar from 'chokidar';
import swaggerJSDoc from 'swagger-jsdoc';
import yaml from 'js-yaml';
import $RefParser from '@apidevtools/json-schema-ref-parser';

import { registerDocs } from '@aws-ee/base-docs';
import openApiCommon from '@aws-ee/base-docs/lib/docs/openapi-common.json';
import { runCommand } from '@aws-ee/base-script-utils';
import { getCommandLogger } from '@aws-ee/base-serverless-solution-commands';

import pluginRegistry from '@aws-ee/main-registry-docs';

// Relative directory where collated Docusaurus site source files should reside
const DIST_DIR = 'dist-autogen';

export default class ServerlessDocsToolsPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      'start-ui': {
        usage:
          'Serves a Documentation UI via a local development server. This command supports live reloading of files in source directories, as configured in the plugin registry',
        lifecycleEvents: ['package', 'start'],
        options: {},
      },
      'package-ui': {
        usage: 'Packages the Documentation UI, ready for deployment',
        lifecycleEvents: ['package', 'build'],
        options: {
          local: {
            usage: 'If enabled, JS/CSS bundles will not be minified.',
            default: false,
          },
        },
      },
      'deploy-ui-s3': {
        usage:
          'Deploys (via "aws s3 sync") a target directory to the bucket with name configured via the `s3BucketName` variable',
        lifecycleEvents: ['package', 'deploy-s3', 'invalidate-cache'],
        options: {
          'invalidate-cache': {
            usage:
              'If enabled, invalidates a CloudFront distribution after deploying (only if the contents of the `s3BucketName` bucket were modified). Requires a `s3CloudFrontDistributionId` variable to be specified.',
            default: false,
          },
        },
      },
      'deploy-ui-ghp': {
        usage: `This command deploys artifacts as a Github Pages site. It first builds the Docusaurus site at \`${DIST_DIR}\` (writing built artifacts to \`${DIST_DIR}/build\`). Then, it creates a commit containing only these built artifacts and pushes it to the configured Git branch (creating one if it doesn't already exist).`,
        lifecycleEvents: ['package', 'deploy-ghp'],
        options: {},
      },
      'create-snapshot-ui': {
        usage: 'This command creates a new Docusaurus version snapshot with the provided version string',
        lifecycleEvents: ['create-snapshot'],
        options: {
          tag: {
            usage: 'Version identifier to tag the snapshot with (e.g. "1.0.0")',
            required: true,
          },
        },
      },
    };

    this.hooks = {
      'start-ui:package': this.package.bind(this),
      'start-ui:start': this.start.bind(this),

      'package-ui:package': this.package.bind(this),
      'package-ui:build': this.build.bind(this),

      'deploy-ui-s3:package': this.package.bind(this),
      'deploy-ui-s3:deploy-s3': this.deployS3.bind(this),
      'deploy-ui-s3:invalidate-cache': this.invalidateCache.bind(this),

      'deploy-ui-ghp:package': this.package.bind(this),
      'deploy-ui-ghp:deploy-ghp': this.deployGhp.bind(this),

      'create-snapshot-ui:create-snapshot': this.createSnapshot.bind(this),
    };

    this.cli = getCommandLogger(this.serverless, 'serverless-docs-tools');
  }

  async start() {
    const docsConfig = await this._readDocsConfig();

    // Watch for and sync any changes to pages and static directories
    this._watchAndSyncInputDirectories(docsConfig.pagesPaths, `${DIST_DIR}/docs`);
    this._watchAndSyncInputDirectories(docsConfig.staticFilesPaths, `${DIST_DIR}/static`);

    // Run Docusaurus local server
    await runCommand({
      command: 'pnpx',
      args: ['docusaurus', 'start', '--port', '3001'],
      cwd: DIST_DIR,
      printCommandFn: msg => this.cli.log(msg),
    });
  }

  async package() {
    const docsConfig = await this._readDocsConfig();

    // Sync registered input directories with `DIST_DIR`
    await this._syncInputDirectories(docsConfig.pagesPaths, `${DIST_DIR}/docs`);
    await this._syncInputDirectories(docsConfig.staticFilesPaths, `${DIST_DIR}/static`);

    // Write API documentation for docusaurus
    await this._writeOpenApi(docsConfig);

    // Write config files
    this._writeSidebarsConfig(docsConfig.sidebarsConfig);
    this._writeDocusaurusConfig(docsConfig.docusaurusConfig);

    // Ensure files are formatted correctly
    await runCommand({
      command: 'pnpm',
      args: ['run', 'format'],
      cwd: DIST_DIR,
      printCommandFn: msg => this.cli.log(msg),
    });
  }

  async build() {
    const isLocal = this.options.local;

    await runCommand({
      command: 'pnpx',
      args: ['docusaurus', 'build', '--out-dir', 'build', isLocal ? '--no-minify' : ''],
      cwd: DIST_DIR,
      printCommandFn: msg => this.cli.log(msg),
    });

    this.cli.log(`UI built successfully and written to "${DIST_DIR}/build"`);
  }

  async deployS3() {
    const bucketName = this.serverless.service.custom.settings.s3BucketName;
    if (!bucketName) {
      this.cli.warn(
        `Skipping deployment of the docs. Missing "s3BucketName" setting. Don't know which S3 bucket to upload the docs to.`,
      );
      return;
    }
    const buildDir = path.resolve(`${DIST_DIR}/build/`);
    this.cli.log(`Deploying UI in "${buildDir}" to ${bucketName} S3 bucket...`);

    const awsProfile = this.serverless.service.custom.settings.awsProfile;
    const args = [
      's3',
      'sync',
      buildDir,
      // Write to docs/ prefix as we assume the CloudFront distribution has multiple S3
      // origins, and the docs website will be accessible from /docs
      `s3://${bucketName}/docs`,
      '--delete',
      '--region',
      this.serverless.service.custom.settings.awsRegion,
    ];
    if (awsProfile) {
      args.push('--profile', awsProfile);
    }
    await runCommand({
      command: 'aws',
      args,
      cwd: DIST_DIR,
      printCommandFn: msg => this.cli.log(msg),
    });
  }

  async invalidateCache() {
    const distributionId = this.serverless.service.custom.settings.s3CloudFrontDistributionId;
    const shouldInvalidate = this.options['invalidate-cache'];
    if (shouldInvalidate && !distributionId) {
      this.cli.warn(
        'Skipping CloudFront Distribution Invalidation. You specified "--invalidate-cache", but `s3CloudFrontDistributionId` setting was not found.',
      );
      return;
    }

    if (shouldInvalidate) {
      this.cli.log('Invalidating CloudFront distribution cache...');
      const sdk = this._getCloudFrontSdk();

      try {
        const invalidation = await sdk
          .createInvalidation({
            DistributionId: distributionId,
            InvalidationBatch: {
              CallerReference: Date.now().toString(),
              Paths: {
                Quantity: 1,
                Items: ['/*'], // Invalidate all files
              },
            },
          })
          .promise();

        this.cli.log(
          `Created new CloudFront invalidation: id=${invalidation.Invalidation.Id}, status=${invalidation.Invalidation.Status}, paths="/*"`,
        );
      } catch (err) {
        throw new Error(`Error invalidating CloudFront ${distributionId} cache: ${err}`);
      }
    }

    this.cli.log('UI deployed successfully');
  }

  async deployGhp() {
    this.cli.log(`Building and deploying UI in "${path.resolve(DIST_DIR)}" via Github Pages...`);

    const { ghpGitUser, ghpUseSsh, ghpDeploymentBranch, ghpCurrentBranch } = this.serverless.service.custom.settings;
    if (!ghpGitUser) {
      // eslint-disable-next-line
      throw new Error('${self:custom.settings.ghpGitUser} must be provided');
    }

    const env = {
      GIT_USER: ghpGitUser,
      USE_SSH: Boolean(ghpUseSsh),
      ...(ghpDeploymentBranch && { DEPLOYMENT_BRANCH: ghpDeploymentBranch }),
      ...(ghpCurrentBranch && { CURRENT_BRANCH: ghpCurrentBranch }),
    };
    await runCommand({
      command: 'pnpx',
      args: ['docusaurus', 'deploy'],
      cwd: DIST_DIR,
      env,
      printCommandFn: msg => this.cli.log(msg),
    });
  }

  async createSnapshot() {
    const { tag } = this.options;
    this.cli.log(`Creating snapshot with tag ${tag}...`);
    await runCommand({
      command: 'pnpx',
      args: ['docusaurus', 'docs:version', tag],
      cwd: DIST_DIR,
      printCommandFn: msg => this.cli.log(msg),
    });
  }

  async _readDocsConfig() {
    this.cli.log('Reading docs config from plugin registry...');
    const { docsSiteRootPath } = this.serverless.service.custom.settings;
    const docsConfig = await registerDocs(pluginRegistry, { docsSiteRootPath });
    return docsConfig;
  }

  async _syncInputDirectories(srcDirs, dstDir) {
    const absDstDir = path.resolve(dstDir);
    this.cli.log(`Removing all contents of "${dstDir}"...`);
    shell.rm('-rf', dstDir);

    this.cli.log(`Writing contents of ["${srcDirs.join('", "')}"] to "${absDstDir}"...`);

    // Copy pages paths and static files paths
    shell.mkdir('-p', dstDir);
    srcDirs.forEach(srcDir => {
      // Do not do this; results in puzzling error message if srcDir not present, not a folder, or is empty.
      // shell.cp('-R', `${srcDir}/*`, dstDir);
      // Instead, do the following
      if (shell.test('-d', srcDir)) {
        shell.ls(srcDir).forEach(item => {
          shell.cp('-R', `${srcDir}/${item}`, `${dstDir}/`);
          this.cli.log(`Found ${item} in ${srcDir}`);
        });
      } else {
        this.cli.warn(`'${srcDir}' not present or not a folder; skipping`);
      }
    });
  }

  async _watchAndSyncInputDirectories(srcDirs, dstDir) {
    const absDstDir = path.resolve(dstDir);
    this.cli.log(`Syncing all changes to ["${srcDirs.join('", "')}"] with "${absDstDir}"...`);

    const watcher = chokidar.watch(srcDirs, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('all', (event, srcPathAbs) => {
      const fsEvents = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'];
      if (!fsEvents.includes(event)) {
        // Ignore events unrelated to files/directories
        return;
      }

      const srcPathAbsPrefix = srcDirs.find(srcDir => srcPathAbs.startsWith(srcDir));
      const srcPathRelative = srcPathAbs.replace(srcPathAbsPrefix, '');
      const dstPathRelative = `${dstDir}${srcPathRelative}`;

      switch (event) {
        case 'add':
        case 'change':
        case 'addDir': {
          this.cli.log(`File change detected. Copying "${srcPathAbs}" to "${path.resolve(dstPathRelative)}"...`);
          shell.cp('-r', srcPathAbs, dstPathRelative);
          break;
        }
        case 'unlink':
        case 'unlinkDir': {
          this.cli.log(`File change detected. Removing "${path.resolve(dstPathRelative)}"...`);
          shell.rm('-rf', dstPathRelative);
          break;
        }
        default:
      }
    });
  }

  _writeDocusaurusConfig(docusaurusConfig) {
    this.cli.log(`Writing "${DIST_DIR}/docusaurus.config.js"...`);

    const enrichedDocusaurusConfig = _.set(
      _.set(
        docusaurusConfig,
        // Add sidebarPath to config
        'presets[0][1].docs.sidebarPath',
        require.resolve(path.resolve(`${DIST_DIR}/sidebars.json`)),
      ),
      // Add customCss to config
      'presets[0][1].theme.customCss',
      require.resolve(path.resolve(`${DIST_DIR}/custom.css`)),
    );
    fs.writeFileSync(
      `${DIST_DIR}/docusaurus.config.js`,
      `module.exports = ${JSON.stringify(enrichedDocusaurusConfig, null, 2)}`,
    );
  }

  _writeSidebarsConfig(sidebarsConfig) {
    this.cli.log(`Writing "${DIST_DIR}/sidebars.json"...`);

    fs.writeFileSync(`${DIST_DIR}/sidebars.json`, JSON.stringify(sidebarsConfig, null, 2));
  }

  _getCloudFrontSdk() {
    const profile = this.serverless.service.custom.settings.awsProfile;
    const region = this.serverless.service.custom.settings.awsRegion;

    aws.config.update({
      maxRetries: 3,
      region,
      sslEnabled: true,
    });

    // If a an AWS SDK profile has been configured, use its credentials
    if (profile) {
      const credentials = new aws.SharedIniFileCredentials({ profile });
      aws.config.update({ credentials });
    }
    return new aws.CloudFront();
  }

  async _writeOpenApi(docsConfig) {
    const controllerConfigs = _.get(docsConfig, 'controllerConfigs');
    const openApiControllerFilePaths = _.map(controllerConfigs, config => _.get(config, 'filePath'));
    const openApiControllerSchemas = _.map(controllerConfigs, config => _.get(config, 'schemas'));
    const schemas = _.reduce(openApiControllerSchemas, _.merge, {});

    // Generate OpenAPI file from JSDoc comments found inside controller files
    // External schemas, extracted from the controller services, are also incorporated
    const { apiUrl } = this.serverless.service.custom.settings;
    const options = {
      definition: {
        info: { description: `Server ${apiUrl}` },
        servers: [{ url: apiUrl }],
        components: { schemas },
      },
      apis: openApiControllerFilePaths,
    };
    const openApiSpec = swaggerJSDoc(_.merge(options, openApiCommon));

    // Convert JSON schemas to OpenAPI 3.0 schemas by removing $schema and dereferencing their internal references
    // TODO: Use @openapi-contrib/json-schema-to-openapi-schema once nulls in schemas have been migrated to work correctly with it
    const jsonSchemasPath = 'components.schemas';
    const jsonSchemas = _.get(openApiSpec, jsonSchemasPath);
    const jsonSchemasAsPairs = _.toPairs(jsonSchemas);
    const openApiSchemasAsPairs = await Promise.all(
      _.map(jsonSchemasAsPairs, async ([key, jsonSchema]) => [
        key,
        await $RefParser.dereference(_.omit(jsonSchema, '$schema')),
      ]),
    );
    _.set(openApiSpec, jsonSchemasPath, Object.fromEntries(openApiSchemasAsPairs));

    fs.writeFileSync(`${DIST_DIR}/openapi.yaml`, yaml.dump(openApiSpec));
  }
}
