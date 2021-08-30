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

import crypto from 'crypto';
import { getRegionalAcm, route53 } from './aws';
import { deepEqualObjectProperties, isObjectEmpty, fnFail, mayBeArn, sleep } from './util';
import { logDebug } from './log';

import { CustomResource } from './custom-resource';

function computeResourceRecordChanges(resourceRecord, existingResourceRecord, refCountBefore, refCountAfter) {
  logDebug(
    `computeResourceRecordChanges: resourceRecord: ${JSON.stringify(
      resourceRecord,
    )} existingResourceRecord: ${JSON.stringify(existingResourceRecord)}`,
  );
  logDebug(`refCountBefore: ${refCountBefore} refCountAfter: ${refCountAfter}`);
  if (deepEqualObjectProperties(resourceRecord, existingResourceRecord)) {
    // no change
    return [];
  }
  const result = [];
  if (!isObjectEmpty(existingResourceRecord) && refCountBefore !== 0 && refCountAfter === 0) {
    // must delete existingResourceRecord
    result.push({ Action: 'DELETE', ResourceRecordSet: existingResourceRecord });
  }
  if (!isObjectEmpty(resourceRecord) && refCountBefore === 0 && refCountAfter !== 0) {
    // must create from resourceRecord
    const { Name, Type, Value } = resourceRecord;
    result.push({
      Action: 'CREATE',
      ResourceRecordSet: {
        Name,
        TTL: 300,
        Type,
        ResourceRecords: [{ Value }],
      },
    });
  }
  return result;
}

function computeManifestRecordChanges(
  existingManifestRecord,
  manifestTemplateRecord,
  actionName,
  conditionFn,
  actionFn,
) {
  logDebug(
    `computeManifestRecordChanges: actionName: ${actionName}: existingManifestRecord: ${JSON.stringify(
      existingManifestRecord,
    )} manifestTemplateRecord: ${JSON.stringify(manifestTemplateRecord)}`,
  );
  const existingRefs = new Set(
    // extract Value from within "" required by TXT record
    (existingManifestRecord.ResourceRecords || []).map(element => element.Value.replace(/^"|"$/g, '')),
  );
  logDebug(`existingRefs: ${JSON.stringify([...existingRefs])}`);
  const refCountBefore = existingRefs.size;
  const changes = [];
  if (conditionFn(existingRefs)) {
    // delete existing record, if needed
    if (existingRefs.size !== 0) {
      changes.push({ Action: 'DELETE', ResourceRecordSet: existingManifestRecord });
    }
    actionFn(existingRefs);
    // create new record, if needed
    if (existingRefs.size !== 0) {
      const futureManifestRecord = {
        ...manifestTemplateRecord,
        TTL: 300,
        ResourceRecords: [...existingRefs].map(ref => ({ Value: `"${ref}"` })), // set the value in "" as required by TXT record
      };
      changes.push({ Action: 'CREATE', ResourceRecordSet: futureManifestRecord });
    }
  }
  const refCountAfter = existingRefs.size;
  // return changes and the refCountBefore/After
  return { changes, refCountBefore, refCountAfter };
}

function computeManifestRecordChangesAdd(certificateArnDigest, existingManifestRecord, manifestTemplateRecord) {
  logDebug(`computeManifestRecordChangesAdd: certificateArnDigest: ${certificateArnDigest}`);
  return computeManifestRecordChanges(
    existingManifestRecord,
    manifestTemplateRecord,
    'Add',
    refs => !refs.has(certificateArnDigest), // apply a change if ref does not yet exist
    refs => refs.add(certificateArnDigest),
  );
}

function computeManifestRecordChangesDel(certificateArnDigest, existingManifestRecord, manifestTemplateRecord) {
  logDebug(`computeManifestRecordChangesDel: certificateArnDigest: ${certificateArnDigest}`);
  return computeManifestRecordChanges(
    existingManifestRecord,
    manifestTemplateRecord,
    'Del',
    refs => refs.has(certificateArnDigest), // apply a change if ref does actually exist
    refs => refs.delete(certificateArnDigest),
  );
}

class DnsValidation extends CustomResource {
  // constructor(event, workspace) {
  //   super(event, workspace);
  // }

  pickProperties(from) {
    // return ({ ...({ DomainName, HostedZoneId, Tags = {} } = from) });  // why is this not working???
    const { CertificateArn, DomainName, HostedZoneId } = from;
    return { CertificateArn, DomainName, HostedZoneId };
  }

  validateProperties(props) {
    ['CertificateArn', 'DomainName', 'HostedZoneId'].forEach(prop => {
      if (props[prop] === undefined) fnFail(`Missing '${prop}' property`);
      if (typeof props[prop] !== 'string') fnFail(`Property ${prop} should be a string`);
    });
    if (!mayBeArn(props.CertificateArn))
      fnFail(`Given CertifiateArn does not seem to be an ARN; '${props.CertificateArn}'`);
  }

  async getDomainValidationOptions({ DomainName, CertificateArn }, acm) {
    let isKnownToBeRelevant = false;

    // this is a polling affair...
    for (let idx = 0; idx < 30; ++idx) {
      // 30 x 2 seconds: try for 1 minute
      await sleep(2000);
      // call describeCertificate until domainValidationOptions[{obj}] show up and all obj have resourceRecord obj populated
      const result = await acm.describeCertificate({ CertificateArn }).promise();
      logDebug(`getDomainValidationOptions: idx-${idx}: describeCertificate:  result: ${JSON.stringify(result)}`);
      const { Certificate: certificate } = result;
      const { DomainValidationOptions: domainValidationOptions } = certificate;

      // check that given domain name is even relevant to this certificate!
      if (!isKnownToBeRelevant) {
        const san = certificate.SubjectAlternativeNames || [];
        if (!san.includes(DomainName)) {
          fnFail(
            `Certificate with ARN '${CertificateArn}' is not applicable for domain '${DomainName}'; applies to '${JSON.stringify(
              san,
            )}'`,
          );
        }
        logDebug('cert is applicable for domain');
        isKnownToBeRelevant = true;
      }

      if (domainValidationOptions === undefined) continue; // try again
      if (!Array.isArray(domainValidationOptions))
        fnFail(`got domainValidationOptions that is not array: ${JSON.stringify(domainValidationOptions)}`);

      const givenDomainValidationOptions = domainValidationOptions.find(element => element.DomainName === DomainName);
      if (givenDomainValidationOptions === undefined) continue; // try again

      // check that givenDomainValidationOptions have ResourceRecord already
      if (givenDomainValidationOptions.ResourceRecord === undefined) continue; // try again

      // happy case!!!!
      return givenDomainValidationOptions;
    }
    // if gotten here fail
    fnFail('timeout in getting domain validation options');
    // above fnFail throws, so this code is never reached
    // put in here to pacify lint
    return undefined;
  }

  // fetch resourceRecords from a given hosted zone; if any not present return empty for those
  async fetchResourceRecords({ HostedZoneId }, { Name, Type }) {
    const params = {
      HostedZoneId,
      MaxItems: '1', // Must be string, go figure!
      StartRecordName: Name,
      StartRecordType: Type,
    };
    const { ResourceRecordSets: resourceRecordSets = [] } = await route53.listResourceRecordSets(params).promise();
    const existing = resourceRecordSets[0] || {};
    return Name === existing.Name && Type === existing.Type ? existing : {};
  }

  async propagateRoute53Change(changeId) {
    // this is a polling affair...
    for (let idx = 0; idx < 180; ++idx) {
      // 180: try for 3 minutes
      await sleep(1000);

      const result = await route53.getChange({ Id: changeId }).promise();
      logDebug(`propagateRoute53Change: idx-${idx}: getChange:  result: ${JSON.stringify(result)}`);
      const { ChangeInfo: changeInfo } = result;
      const { Status: status } = changeInfo;
      if (status === 'PENDING') continue; // try agains

      // happy case!!!!
      return status;
    }

    // if gotten here fail
    fnFail('timeout in waiting for Route 53 change to be applied');
    // above fnFail throws, so this code is never reached
    // put in here to pacify lint
    return undefined;
  }

  computeCertificateArnDigest(certificateArn) {
    return crypto
      .createHash('sha256')
      .update(certificateArn)
      .digest('base64')
      .replace(/=/g, '');
  }

  constructManifestRecord(Name) {
    // Need to alter the Name, because a CNAME record cannot coexist with any other record (same Name)
    // (as per RFC1912 section 2.4)
    const parts = Name.split('.');
    parts[0] += '_';
    return { Name: parts.join('.'), Type: 'TXT' };
  }

  async doCreate(properties, acm) {
    logDebug('In DnsValidation::doCreate');
    const { HostedZoneId: hostedZoneId, CertificateArn: certificateArn } = properties;

    // fetch the Domain validation options
    const { ResourceRecord: resourceRecord } = await this.getDomainValidationOptions(properties, acm);
    const { Name } = resourceRecord;
    const manifestRecord = this.constructManifestRecord(Name);
    const existingResourceRecord = await this.fetchResourceRecords(properties, resourceRecord);
    logDebug(`existingResourceRecord ${JSON.stringify(existingResourceRecord)}`);
    const existingManifestRecord = await this.fetchResourceRecords(properties, manifestRecord);
    logDebug(`existingManifestRecord ${JSON.stringify(existingManifestRecord)}`);
    const certificateArnDigest = this.computeCertificateArnDigest(certificateArn);
    logDebug(`certificateArnDigest: ${certificateArnDigest}`);
    const { changes, refCountBefore, refCountAfter } = computeManifestRecordChangesAdd(
      certificateArnDigest,
      existingManifestRecord,
      manifestRecord,
    );
    logDebug(`Changes after computeManifestRecordChangesAdd are: ${JSON.stringify(changes)}`);
    changes.push(
      ...computeResourceRecordChanges(resourceRecord, existingResourceRecord, refCountBefore, refCountAfter),
    );
    logDebug(`Changes are: ${JSON.stringify(changes)}`);

    if (changes.length !== 0) {
      const changeResourceRecordSetsParams = {
        ChangeBatch: {
          Changes: changes,
          Comment: `Create domain validation record(s) for certificate ${certificateArn}`,
        },
        HostedZoneId: hostedZoneId,
      };
      logDebug(`route53 changes: ${JSON.stringify(changeResourceRecordSetsParams)}`);
      const result = await route53.changeResourceRecordSets(changeResourceRecordSetsParams).promise();
      logDebug(`create: route53.changeResourceRecordSets: result: ${JSON.stringify(result)}`);
      const changeId = result.ChangeInfo.Id;
      const changeStatus = await this.propagateRoute53Change(changeId);
      if (changeStatus !== 'INSYNC') fnFail(`route53 changes failed to sync; status is ${changeStatus}`);
    }
  }

  async doRemove(properties, acm) {
    logDebug('In DnsValidation::doRemove');
    const { HostedZoneId: hostedZoneId, CertificateArn: certificateArn } = properties;

    // fetch the Domain validation options
    const { ResourceRecord: resourceRecord } = await this.getDomainValidationOptions(properties, acm);
    const { Name } = resourceRecord;
    const manifestRecord = this.constructManifestRecord(Name);
    const existingResourceRecord = await this.fetchResourceRecords(properties, resourceRecord);
    logDebug(`existingResourceRecord ${JSON.stringify(existingResourceRecord)}`);
    const existingManifestRecord = await this.fetchResourceRecords(properties, manifestRecord);
    logDebug(`existingManifestRecord ${JSON.stringify(existingManifestRecord)}`);
    const certificateArnDigest = this.computeCertificateArnDigest(certificateArn);
    logDebug(`certificateArnDigest: ${certificateArnDigest}`);
    const { changes, refCountBefore, refCountAfter } = computeManifestRecordChangesDel(
      certificateArnDigest,
      existingManifestRecord,
      manifestRecord,
    );
    logDebug(`Changes after computeManifestRecordChangesDel are: ${JSON.stringify(changes)}`);
    changes.push(
      ...computeResourceRecordChanges(resourceRecord, existingResourceRecord, refCountBefore, refCountAfter),
    );
    logDebug(`Changes are: ${JSON.stringify(changes)}`);

    if (changes.length !== 0) {
      const changeResourceRecordSetsParams = {
        ChangeBatch: {
          Changes: changes,
          Comment: `Remove domain validation record(s) for certificate ${certificateArn}`,
        },
        HostedZoneId: hostedZoneId,
      };
      logDebug(`route53 changes: ${JSON.stringify(changeResourceRecordSetsParams)}`);
      const result = await route53.changeResourceRecordSets(changeResourceRecordSetsParams).promise();
      logDebug(`remove: route53.changeResourceRecordSets: result: ${JSON.stringify(result)}`);
      const changeId = result.ChangeInfo.Id;
      const changeStatus = await this.propagateRoute53Change(changeId);
      if (changeStatus !== 'INSYNC') fnFail(`route53 changes failed to sync; status is ${changeStatus}`);
    }
  }

  async create() {
    logDebug('In DnsValidation::create');
    const workspace = this.workspace;
    logDebug(`Workspace is ${JSON.stringify(workspace)}`);

    const properties = this.pickProperties(workspace.properties || {});
    logDebug(`Props: ${JSON.stringify(properties)}`);
    this.validateProperties(properties);

    const { CertificateArn, DomainName, HostedZoneId } = properties;

    // ACM needs to be in the region where the certificate resides; extract region from certificate ARN
    properties.Region = properties.CertificateArn.split(':')[3];
    logDebug(`Talking to ACM in '${properties.Region}' region`);
    const acm = getRegionalAcm(properties);

    await this.doCreate(properties, acm);

    logDebug(
      `Attached domain validation records for: '${DomainName}' with certificate ARN '${CertificateArn}' in hosted zone '${HostedZoneId}'`,
    );
    workspace.physicalResourceId = `${DomainName},${CertificateArn},${HostedZoneId}`;
  }

  async update() {
    logDebug('In DnsValidation::update');
    const workspace = this.workspace;
    logDebug(`Workspace is ${JSON.stringify(workspace)}`);

    const properties = this.pickProperties(workspace.properties || {});
    logDebug(`Props: ${JSON.stringify(properties)}`);
    this.validateProperties(properties);

    const oldProperties = this.pickProperties(workspace.oldProperties || {});
    logDebug(`Old Props: ${JSON.stringify(oldProperties)}`);

    if (deepEqualObjectProperties(properties, oldProperties)) {
      // nothing changed!!!
      logDebug('No meaningful change detected');
    } else {
      // ACM needs to be in the region where the certificate resides; extract region from certificate ARN
      properties.Region = properties.CertificateArn.split(':')[3];
      logDebug(`Talking to ACM in '${properties.Region}' region`);
      const acm = getRegionalAcm(properties);

      await this.doCreate(properties, acm);
    }

    const { CertificateArn, DomainName, HostedZoneId } = properties;
    logDebug(
      `Attached domain validation records for: '${DomainName}' with certificate ARN '${CertificateArn}' in hosted zone '${HostedZoneId}'`,
    );
    workspace.physicalResourceId = `${DomainName},${CertificateArn},${HostedZoneId}`;
  }

  async remove() {
    logDebug('In DnsValidation::remove');
    const workspace = this.workspace;
    logDebug(`Workspace is ${JSON.stringify(workspace)}`);

    const properties = this.pickProperties(workspace.properties || {});
    logDebug(`Props: ${JSON.stringify(properties)}`);
    this.validateProperties(properties);

    const { CertificateArn, DomainName, HostedZoneId } = properties;

    // ACM needs to be in the region where the certificate resides; extract region from certificate ARN
    properties.Region = properties.CertificateArn.split(':')[3];
    logDebug(`Talking to ACM in '${properties.Region}' region`);
    const acm = getRegionalAcm(properties);

    await this.doRemove(properties, acm);

    logDebug(
      `Detached domain validation records for: '${DomainName}' with certificate ARN '${CertificateArn}' from hosted zone '${HostedZoneId}'`,
    );
    workspace.physicalResourceId = `${DomainName},${CertificateArn},${HostedZoneId}`;
  }
}

export { DnsValidation };
