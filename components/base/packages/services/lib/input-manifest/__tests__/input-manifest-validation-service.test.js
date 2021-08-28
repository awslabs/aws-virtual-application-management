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

import InputManifestValidationService from '../input-manifest-validation-service';

describe('InputManifestValidationService', () => {
  it('reacts gracefully to an empty manifest', async () => {
    const inputManifest = {};
    const config = {
      A: 'some string',
      B: 42,
    };
    const result = await new InputManifestValidationService().getValidationErrors(inputManifest, config);
    expect(result).toEqual([]);
  });

  it('returns errors from an invalid manifest', async () => {
    const inputManifest = {
      sections: [
        { children: [{ name: 'A', rules: 'required|integer' }] },
        { children: [{ name: 'B', rules: 'required|integer' }] },
        { children: [{ name: 'C', rules: 'required|integer' }] },
      ],
    };
    const config = {
      A: 'some string',
      B: 42,
    };
    const result = await new InputManifestValidationService().getValidationErrors(inputManifest, config);
    expect(result).toEqual([
      {
        type: 'invalid',
        message: 'The A must be an integer.',
      },
      {
        message: 'The C field is required.',
        type: 'invalid',
      },
    ]);
  });
});
