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

const _ = require('lodash');

/**
 * Updates a JSON Web Token's (JWT's) claims/properties, returning a new JWT with the applied updates. The new JWT is
 * not valid since it is not resigned, however. This allows tests to simulate JWT tampering attacks against APIs by
 * spoofing various claims within the JWT.
 * @param {string} token The JWT to be updated
 * @param {object} param1
 * @param {object} param1.headerUpdates The JOSE header parameters to be modified
 * @param {object} param1.bodyUpdates The JWT claims to be modified
 * @return {string} The updated, invalid JWT
 */
function jwtTamper(token, { headerUpdates = {}, bodyUpdates = {} }) {
  // Extract/decode original header, body, and signature
  const [b64header, b64body, signature] = _.split(token, '.');

  const decodeObj = (str) => JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
  const header = decodeObj(b64header);
  const body = decodeObj(b64body);

  // Update values
  const updateAttrs = (obj, updates) =>
    _.forEach(updates, (val, key) => {
      obj[key] = val;
    });
  updateAttrs(header, headerUpdates);
  updateAttrs(body, bodyUpdates);

  // Re-encode/rejoin updated header and body with signature
  const encodeObj = (obj) => _.trimEnd(Buffer.from(JSON.stringify(obj)).toString('base64'), '=');
  return _.join([encodeObj(header), encodeObj(body), signature], '.');
}

/**
 * Runs the provided async function and prints the error object (if any) to the console, it does NOT rethrow
 * the error
 */
async function run(fn) {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return undefined;
  }
}

module.exports = {
  jwtTamper,
  run,
};
