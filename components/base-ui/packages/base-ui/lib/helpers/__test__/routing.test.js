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

import * as fc from 'fast-check';
import { createLink, createLinkWithSearch, reload, gotoFn } from '../routing';

describe('routing', () => {
  describe('createLink, createLinkWithSearch', () => {
    it('returns an object with pathname and hash, state from location', () => {
      fc.assert(
        fc.property(fc.object(), fc.object(), fc.object(), fc.object(), (pathname, hash, state, search) => {
          const location = { hash, state };
          expect(createLink({ pathname, location, search })).toEqual({ pathname, hash, state });
          expect(createLinkWithSearch({ pathname, location, search })).toEqual({ pathname, hash, state, search });
        }),
      );
    });
  });

  describe('reload', () => {
    it('returns an object with pathname and hash, state from location', () => {
      jest.useFakeTimers();
      reload();
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 150);
    });
  });

  describe('gotoFn', () => {
    it('returns the parameter with goto bound', () => {
      fc.assert(
        fc.property(fc.object(), fc.object(), fc.object(), fc.array(fc.object()), (pathname, hash, state, history) => {
          const location = { hash, state };
          const reactComponent = {
            props: {
              location,
              history,
            },
          };
          gotoFn(reactComponent)(pathname);
          expect(reactComponent.props.history).toContainEqual({
            pathname,
            hash,
            state,
          });
        }),
      );
    });
  });
});
