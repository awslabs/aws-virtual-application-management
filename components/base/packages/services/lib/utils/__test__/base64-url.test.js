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

import { encode, decode } from '../base64-url';

describe('base64-url', () => {
  it('encodes a string and replaces "==" padding', () => {
    const str = 'A+/BBCD';
    const base64 = Buffer.from(str, 'utf8').toString('base64');

    expect(base64).toMatch('QSsvQkJDRA=='); // This standard base64

    const encoded = encode(str);
    expect(encoded).toMatch('QSsvQkJDRA'); // '==' padding should be removed
  });

  it('decodes a string', () => {
    const str = 'QSsvQkJDRA';
    const decoded = decode(str);
    expect(decoded).toMatch('A+/BBCD');
  });
});
