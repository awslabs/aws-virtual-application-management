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

import { itProp, fc } from 'jest-fast-check';
import { getPrincipalObjFromPrincipalStr, getPrincipalStrFromPrincipalObj } from '../User';

describe('User', () => {
  describe('getPrincipalObjFromPrincipalStr', () => {
    itProp('should return parameter parsed as JSON', [fc.json()], a =>
      expect(getPrincipalObjFromPrincipalStr(a)).toEqual(JSON.parse(a)),
    );
  });

  describe('getPrincipalStrFromPrincipalObj', () => {
    itProp('should return parameter parsed as JSON', [fc.string(), fc.string()], (username, ns) => {
      expect(getPrincipalStrFromPrincipalObj({ username, ns })).toEqual(JSON.stringify({ username, ns }));
    });
  });
});
