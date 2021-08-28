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

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { getRegionalAcm } from './aws';
import { deepEqualObjectProperties, fnFail, mayBeArn, isObjectEmpty, sleep } from './util';
import { logDebug, logInfo } from './log';

import { CustomResource } from './custom-resource';

function convertTags(tags) {
  return Object.entries(tags).map(([Key, Value]) => ({ Key, Value }));
}

function computeTagsChange(tags, oldTags) {
  const tagsToRemove = {};
  const tagsToAdd = {};
  const tagNames = new Set();
  Object.keys(tags).forEach(name => tagNames.add(name));
  const oldTagNames = new Set();
  Object.keys(oldTags).forEach(name => oldTagNames.add(name));

  for (const name of oldTagNames) {
    if (!tagNames.has(name)) {
      tagsToRemove[name] = oldTags[name];
    }
  }
  for (const name of tagNames) {
    tagsToAdd[name] = tags[name]; // update unconditionally!
  }
  return { tagsToRemove, tagsToAdd };
}

class CertificateRaw extends CustomResource {
  // constructor(event, workspace) {
  //   super(event, workspace);
  // }

  pickProperties(from) {
    // return ({ ...({ DomainName, HostedZoneId, Tags = {} } = from) });  // why is this not working???
    const { DomainName, SubjectAlternativeNames, Tags = {}, Region } = from;
    return { DomainName, SubjectAlternativeNames, Tags, Region };
  }

  validateProperties(props) {
    ['DomainName'].forEach(prop => {
      if (props[prop] === undefined) fnFail(`Missing '${prop}' property`);
      if (typeof props[prop] !== 'string') fnFail(`Property ${prop} should be a string`);
    });
    const san = props.SubjectAlternativeNames;
    if (san) {
      if (!Array.isArray(san)) fnFail(`SubjectAlternativeNames should be an array; got ${JSON.stringify(san)}`);
      san.forEach(entry => {
        if (typeof entry !== 'string')
          fnFail(`Entries in SubjectAlternativeNames should be strings; '${JSON.stringify(entry)}' isn not a string`);
      });
    }
  }

  async waitForNotInUse(CertificateArn, acm) {
    const isInUse = async idx => {
      // call describeCertificate return InUseBy.length !== 0
      const result = await acm.describeCertificate({ CertificateArn }).promise();
      logDebug(`waitForNotInUse: idx-${idx}: describeCertificate:  result: ${JSON.stringify(result)}`);
      const { Certificate: certificate } = result;
      const { InUseBy: inUseBy } = certificate;
      return inUseBy.length !== 0;
    };

    // this is a polling affair...
    // call describeCertificate until InUseBy is an empty array
    // worst case scenario it will take 15 mins; alas, the lambda execution is also 15 minutes; race condition?
    // for the first 1 minutes check once every 10 seconds
    for (let idx = 0; idx < 6; ++idx) {
      // 6 times
      if (!(await isInUse(idx))) return;
      await sleep(10000); // every 10 seconds
    }
    // for next 12 minutes check once every 60 seconds
    for (let idx = 6; idx < 6 + 12; ++idx) {
      // 12 times
      if (!(await isInUse(idx))) return;
      await sleep(60000); // every 60 seconds
    }
    // for next 1 minutes check once every 10 seconds
    for (let idx = 6 + 12; idx < 6 + 12 + 6; ++idx) {
      // 6 times
      if (!(await isInUse(idx))) return;
      await sleep(10000); // every 10 seconds
    }
    // for next 1 minutes check once every 1 seconds
    for (let idx = 6 + 12 + 6; idx < 6 + 12 + 6 + 60 - 1; ++idx) {
      // 59 times
      if (!(await isInUse(idx))) return;
      await sleep(1000); // every 1 second
    }
    // try one last time
    if (!(await isInUse(6 + 12 + 6 + 60))) return;
    // by the time got here almost 15 minutes passed (all but a bit less than a second)

    // if got here fail
    fnFail('timeout in waiting for certificate not be in use in preparation for deletion');
  }

  needNewResource(properties, oldProperties) {
    return properties.DomainName !== oldProperties.DomainName || properties.Region !== oldProperties.Region;
  }

  updateResourceInPlace(properties, oldProperties) {
    return !deepEqualObjectProperties(properties.Tags || {}, oldProperties.Tags || {});
  }

  async create() {
    logDebug('In CertificateRaw::create');
    const workspace = this.workspace;
    logDebug(`Workspace is ${JSON.stringify(workspace)}`);

    const { requestId, stackArn } = workspace;
    const properties = this.pickProperties(workspace.properties || {});
    logDebug(`Props: ${JSON.stringify(properties)}`);
    this.validateProperties(properties);

    // fetch stackTags
    const stackTags = await this.fetchStackTags(stackArn);

    // request the certificate
    const { DomainName, SubjectAlternativeNames, Tags } = properties;
    const domainNames = new Set([DomainName, ...(SubjectAlternativeNames || [])]);
    const requestCertificateParams = {
      DomainName,
      DomainValidationOptions: [...domainNames].map(item => ({
        DomainName: item,
        ValidationDomain: item,
      })),
      ValidationMethod: 'DNS',
      SubjectAlternativeNames,
      IdempotencyToken: requestId,
      Tags: convertTags({ ...stackTags, ...Tags }),
    };

    const acm = getRegionalAcm(properties);
    const { CertificateArn } = await acm.requestCertificate(requestCertificateParams).promise();
    logDebug(`Requested certificate with ARN: '${CertificateArn}'`);
    workspace.physicalResourceId = CertificateArn;
  }

  async update() {
    logDebug('In CertificateRaw::update');
    const workspace = this.workspace;
    logDebug(`Workspace is ${JSON.stringify(workspace)}`);

    const { physicalResourceId: CertificateArn } = workspace;
    const properties = this.pickProperties(workspace.properties || {});
    logDebug(`Props: ${JSON.stringify(properties)}`);
    this.validateProperties(properties);
    const oldProperties = this.pickProperties(workspace.oldProperties || {});
    logDebug(`OldProps: ${JSON.stringify(oldProperties)}`);

    if (this.needNewResource(properties, oldProperties)) {
      logDebug('Creating new resource');
      // wipe off the old resourceId, in case creating a new one fails
      delete workspace.physicalResourceId;
      await this.create();
    } else if (this.updateResourceInPlace(properties, oldProperties)) {
      logDebug('Updating resource in place');
      // ignoring stack tags
      const { tagsToRemove, tagsToAdd } = computeTagsChange(properties.Tags || {}, oldProperties.Tags || {});

      const acm = getRegionalAcm(properties);
      if (!isObjectEmpty(tagsToRemove)) {
        // Remove tags that must vanish
        logDebug(`tagsToRemove: ${JSON.stringify(tagsToRemove)}`);
        const removeTagsParams = {
          CertificateArn,
          Tags: convertTags(tagsToRemove),
        };
        await acm.removeTagsFromCertificate(removeTagsParams).promise();
        logDebug('Tags removed');
      }

      if (!isObjectEmpty(tagsToAdd)) {
        // update/create tags that are new or changed
        logDebug(`tagsToAdd: ${JSON.stringify(tagsToAdd)}`);
        const addTagsParams = {
          CertificateArn,
          Tags: convertTags(tagsToAdd), // this will not update stack tags; may or may not consider that
        };
        await acm.addTagsToCertificate(addTagsParams).promise();
        logDebug('Tags added/updated');
      }
    } else {
      logDebug('No meaningful properties difference; nothing to update!');
    }
  }

  async remove() {
    logDebug('In CertificateRaw::remove');
    const workspace = this.workspace;
    logDebug(`Workspace is ${JSON.stringify(workspace)}`);

    const { physicalResourceId: CertificateArn } = workspace;
    const properties = this.pickProperties(workspace.properties || {});
    logDebug(`Props: ${JSON.stringify(properties)}`);
    this.validateProperties(properties);

    logDebug(`Initiate deleting certificate with ARN: '${CertificateArn}'`);
    if (mayBeArn(CertificateArn)) {
      const acm = getRegionalAcm(properties);
      await this.waitForNotInUse(CertificateArn, acm);
      await acm.deleteCertificate({ CertificateArn }).promise();
    } else {
      logInfo('Not a valid ARN; skip deleting');
    }
  }
}

export { CertificateRaw };
