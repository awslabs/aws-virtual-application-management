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

import _ from 'lodash';

// eslint-disable-next-line no-unused-vars
function resolveExplicit(aws, params, settings, cli) {
  const prefix = 'Explicit resolver';
  const resolveExplicitFn = async param => {
    ['Name', 'Value'].forEach(key => {
      if (!_.has(param, key))
        throw new Error(`${prefix}: Missing required '${key}' setting in ${JSON.stringify(param)}`);
    });
    const result = {};
    _.set(result, param.Name, {
      Value: param.Value,
      Description: param.Description,
    });
    return result;
  };
  // return array of promises
  return params.map(resolveExplicitFn);
}

async function fetchCertificates(acm) {
  const certificates = [];
  const params = {
    CertificateStatuses: ['PENDING_VALIDATION', 'ISSUED', 'INACTIVE'],
    Includes: {
      keyTypes: ['RSA_2048', 'RSA_1024', 'RSA_4096', 'EC_prime256v1', 'EC_secp384r1', 'EC_secp521r1'],
    },
  };
  do {
    // eslint-disable-next-line no-await-in-loop
    const result = await acm.listCertificates(params).promise();
    certificates.push(...result.CertificateSummaryList);
    const { NextToken } = result;
    _.assign(params, { NextToken });
  } while (params.NextToken);

  return certificates;
}

// eslint-disable-next-line no-unused-vars
function resolveCertificateDomainName(aws, params, settings, cli) {
  const prefix = 'ACM certificate resolver';
  const acm = new aws.ACM();
  const certificatesPromise = Promise.resolve().then(() => fetchCertificates(acm));
  const resolveCertificate = async param => {
    ['Name', 'DomainName'].forEach(key => {
      if (!_.has(param, key))
        throw new Error(`${prefix}: Missing required '${key}' setting in ${JSON.stringify(param)}`);
    });
    const certificates = await certificatesPromise;
    const result = {};
    const foundCertificate = certificates.find(certificate => certificate.DomainName === param.DomainName);
    if (foundCertificate != null)
      _.set(result, param.Name, {
        Value: foundCertificate.CertificateArn,
        Description: param.Description,
      });
    return result;
  };
  // return array of promises
  return params.map(resolveCertificate);
}

async function resolveDependentSettings(aws, params, settings, cli) {
  const dispatch = {
    certificates: resolveCertificateDomainName,
    explicit: resolveExplicit,
  };
  const all = await Promise.all(
    _.flatten(_.map(dispatch, (value, key) => value(aws, _.get(params, key, []), settings, cli))),
  );
  return _.assign({}, ...all);
}

export { resolveDependentSettings };
