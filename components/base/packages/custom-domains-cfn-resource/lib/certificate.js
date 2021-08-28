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
import { fnFail, mayBeArn, sleep } from './util';
import { logDebug } from './log';
import { CustomResource } from './custom-resource';

class Certificate extends CustomResource {
  pickProperties(from) {
    // return ({ ...({ DomainName, Validations } = from) });  // why is this not working???
    const { CertificateArn, Validations } = from;
    return { CertificateArn, Validations };
  }

  validateProperties(props) {
    ['CertificateArn', 'Validations'].forEach(prop => {
      if (props[prop] === undefined) fnFail(`Missing '${prop}' property`);
    });
    if (typeof props.CertificateArn !== 'string') fnFail(`Property CertificateArn should be a string`);
    if (!mayBeArn(props.CertificateArn))
      fnFail(`Given CertifiateArn does not seem to be an ARN; '${props.CertificateArn}'`);
    if (!Array.isArray(props.Validations))
      fnFail(`got Validations property that is not array: ${JSON.stringify(props.Validations)}`);
    props.Validations.forEach(entry => {
      if (typeof entry !== 'string')
        fnFail(`Elements of Validations property '${JSON.stringify(entry)}' is not a string`);
    });
  }

  async waitForValidation(CertificateArn, acm) {
    // this is a polling affair...
    for (let idx = 0; idx < 300; ++idx) {
      // 300: try for 5 minutes
      await sleep(1000);
      // call describeCertificate until status is no longer PENDING_VALIDATION
      const result = await acm.describeCertificate({ CertificateArn }).promise();
      logDebug(`waitForValidation: idx-${idx}: describeCertificate:  result: ${JSON.stringify(result)}`);
      const { Certificate: certificate } = result;
      const { Status: status } = certificate;
      if (status === 'PENDING_VALIDATION') continue;

      // happy case!!!!
      return status;
    }
    // if gotten here fail
    fnFail('timeout in waiting for certificate issuance');
    // above fnFail throws, so this code is never reached
    // put in here to pacify lint
    return undefined;
  }

  async create() {
    logDebug('In Certificate::create');
    const workspace = this.workspace;
    logDebug(`Workspace is ${JSON.stringify(workspace)}`);

    const properties = this.pickProperties(workspace.properties || {});
    logDebug(`Props: ${JSON.stringify(properties)}`);
    this.validateProperties(properties);

    // ACM needs to be in the region where the certificate resides; extract region from certificate ARN
    properties.Region = properties.CertificateArn.split(':')[3];
    logDebug(`Talking to ACM in '${properties.Region}' region`);
    const acm = getRegionalAcm(properties);

    const certificateStatus = await this.waitForValidation(properties.CertificateArn, acm);
    if (certificateStatus !== 'ISSUED') fnFail(`ACM failed to issue certificate; status is ${certificateStatus}`);
    workspace.physicalResourceId = properties.CertificateArn;
  }

  async update() {
    logDebug('In Certificate::update');
    const workspace = this.workspace;
    logDebug(`Workspace is ${JSON.stringify(workspace)}`);

    const properties = this.pickProperties(workspace.properties || {});
    logDebug(`Props: ${JSON.stringify(properties)}`);
    this.validateProperties(properties);

    // ACM needs to be in the region where the certificate resides; extract region from certificate ARN
    properties.Region = properties.CertificateArn.split(':')[3];
    logDebug(`Talking to ACM in '${properties.Region}' region`);
    const acm = getRegionalAcm(properties);

    const certificateStatus = await this.waitForValidation(properties.CertificateArn, acm);
    if (certificateStatus !== 'ISSUED') fnFail(`ACM failed to issue certificate; status is ${certificateStatus}`);
    workspace.physicalResourceId = properties.CertificateArn;
  }

  async remove() {
    logDebug('In Certificate::remove');
    // nothing to do
  }
}

export { Certificate };
