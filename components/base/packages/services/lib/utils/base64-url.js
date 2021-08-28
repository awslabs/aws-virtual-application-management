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

// This is to replace the third party library https://github.com/brianloveswords/base64url
// The library was creating an error during the runtime of a local lambda invocation in post deployment.
// In general, we don't need to encode/decode when sending data to the UI even if we think this data needs
// to come back in a query parameter. The reason is that most libraries already handle the url/query parameter
// encoding and decoding, there is no need to be doing this on the server side.

// This code is inspired by https://github.com/joaquimserafim/base64-url/blob/v2.3.3/index.js

function encode(str = '', encoding = 'utf8') {
  // First, we use the builtin base64 encoding using the Buffer class.
  const encoded = Buffer.from(str, encoding).toString('base64');

  // The encoded string is expected to be base64 but not fully ready for a url inclusion
  // We will replace '+' with '-', '/' with '_' and '=' with ''.
  // See https://base64.guru/standards/base64url

  return encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function decode(str = '', encoding = 'utf8') {
  // str is based64 with additional replacement as discussed here https://base64.guru/standards/base64url
  // Before we can decode the base64 using the builtin base64 decoder, we first need to 'unescape' the
  // characters that we replaced in the 'encode' function. In addition, we need to account for the base 64
  // '=' padding.
  const padded = str + '==='.slice((str.length + 3) % 4);

  const encoded = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(encoded, 'base64').toString(encoding);
}

export { encode, decode };
