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

import { response } from './response';
import { logInfo, logError } from './log';
import { closure } from './util';
import { CertificateRaw } from './certificate-raw';
import { DnsValidation } from './dns-validation';
import { Certificate } from './certificate';
import { InvalidResource } from './invalid-resource';

function handler(event, context) {
  logInfo(`Event: ${JSON.stringify(event, null, 2)}`);
  logInfo(`Context: ${JSON.stringify(context, null, 2)}`);

  const { ResourceType: resourceType, PhysicalResourceId } = event;
  const workspace = { physicalResourceId: PhysicalResourceId };

  const dispatch = {
    'Custom::CertificateRaw': new CertificateRaw(event, workspace),
    'Custom::DnsValidation': new DnsValidation(event, workspace),
    'Custom::Certificate': new Certificate(event, workspace),
  };

  const fnResource = dispatch[resourceType] || new InvalidResource(resourceType);

  fnResource
    .handler()
    .then(() => {
      const { responseData = {}, physicalResourceId } = workspace;
      response.send(event, context, {
        responseStatus: response.SUCCESS,
        responseData: closure(responseData),
        physicalResourceId,
      });
    })
    .catch(error => {
      logError(error.stack);
      const { responseData = {}, physicalResourceId = 'none' } = workspace;
      const params = {
        responseStatus: response.FAILED,
        reason: error.stack,
        responseData: closure(responseData),
        physicalResourceId,
      };
      response.send(event, context, params);
    });
}

export default handler;
