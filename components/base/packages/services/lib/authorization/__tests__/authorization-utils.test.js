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
import { itProp, fc } from 'jest-fast-check';
import {
  allow,
  deny,
  allowIfCreatorOrAdmin,
  allowIfCurrentUserOrAdmin,
  allowIfCurrentUser,
  allowIfActive,
  allowIfAdmin,
  allowIfHasAllCapabilities,
  allowIfHasAnyCapability,
  isAllow,
  isDeny,
  isCurrentUserOrAdmin,
  isAdmin,
  isActive,
} from '../authorization-utils';

const userId = 'testUser';
const emptyContext = {};
const adminContext = { principal: { isAdmin: true } };
const activeContext = { principal: { status: 'active' } };
const currentUserContext = { principalIdentifier: { uid: userId } };
const userContextWithCapabilities = {
  principalIdentifier: { uid: userId },
  principal: { capabilityIds: ['canPerformA', 'canPerformB', 'canPerformC'] },
};

describe('authorization-utils', () => {
  describe('.isAdmin', () => {
    it('is false when not admin', () => {
      expect(isAdmin(emptyContext)).toBe(false);
    });

    it('is true when admin', () => {
      expect(isAdmin(adminContext)).toBe(true);
    });
  });

  describe('.isCurrentUserOrAdmin', () => {
    it('is false when neither', () => {
      expect(isCurrentUserOrAdmin(emptyContext, { uid: userId })).toBe(false);
    });

    it('is true when admin', () => {
      expect(isCurrentUserOrAdmin(adminContext, { uid: userId })).toBe(true);
    });

    it('is true when current user', () => {
      expect(isCurrentUserOrAdmin(currentUserContext, { uid: userId })).toBe(true);
    });
  });

  describe('.isActive', () => {
    it('is false when not active', () => {
      expect(isActive(emptyContext)).toBe(false);
    });

    it('is true when active', () => {
      expect(isActive(activeContext)).toBe(true);
    });
  });

  describe('.allow', () => {
    it('returns the expected value', () => {
      expect(allow()).toEqual({ effect: 'allow' });
    });
  });

  describe('.deny', () => {
    itProp('returns the expected value', [fc.string(), fc.boolean()], (message, safe) => {
      expect(deny(message, safe)).toEqual({ effect: 'deny', reason: { message, safe } });
    });
  });

  describe('.allowIfCreatorOrAdmin', () => {
    itProp('denies when item has no createdBy field', [fc.string(), fc.string()], async (action, resource) => {
      expect(await allowIfCreatorOrAdmin(emptyContext, { action, resource }, {})).toEqual(
        deny(`Cannot ${action} the ${resource}. ${resource} creator information is not available`),
      );
    });

    itProp('denies when not creator user', [fc.string(), fc.string()], async (action, resource) => {
      expect(await allowIfCreatorOrAdmin(emptyContext, { action, resource }, { createdBy: 'testUser' })).toEqual(
        deny(`Cannot perform the specified action "${action}". Only admins or current user can.`),
      );
    });

    itProp('allows when creator user', [fc.string(), fc.string()], async (action, resource) => {
      expect(await allowIfCreatorOrAdmin(currentUserContext, { action, resource }, { createdBy: 'testUser' })).toEqual(
        allow(),
      );
    });

    itProp('allows when admin', [fc.string(), fc.string()], async (action, resource) => {
      expect(await allowIfCreatorOrAdmin(adminContext, { action, resource }, { createdBy: 'testUser' })).toEqual(
        allow(),
      );
    });
  });

  describe('.allowIfCurrentUserOrAdmin', () => {
    itProp('is false when neither', fc.string(), async action => {
      expect(await allowIfCurrentUserOrAdmin(emptyContext, { action }, { uid: userId })).toEqual(
        deny(`Cannot perform the specified action "${action}". Only admins or current user can.`),
      );
    });

    it('is true when admin', async () => {
      expect(await allowIfCurrentUserOrAdmin(adminContext, { action: 'testAction' }, { uid: userId })).toEqual(allow());
    });

    it('is true when current user', async () => {
      expect(await allowIfCurrentUserOrAdmin(currentUserContext, { action: 'testAction' }, { uid: userId })).toEqual(
        allow(),
      );
    });
  });

  describe('.allowIfCurrentUser', () => {
    itProp('is false when not current user', fc.string(), async action => {
      expect(await allowIfCurrentUser(emptyContext, { action }, { uid: userId })).toEqual(
        deny(`Cannot perform the specified action "${action}" on other user's resources.`),
      );
    });

    it('is true when current user', async () => {
      expect(await allowIfCurrentUser(currentUserContext, { action: 'testAction' }, { uid: userId })).toEqual(allow());
    });
  });

  describe('.allowIfActive', () => {
    itProp('is false when not active', fc.string(), async action => {
      expect(await allowIfActive(emptyContext, { action })).toEqual(
        deny(`Cannot perform the specified action "${action}". The caller is not active.`),
      );
    });

    it('is true when active', async () => {
      expect(await allowIfActive(activeContext, { action: 'testAction' })).toEqual(allow());
    });
  });

  describe('.allowIfAdmin', () => {
    itProp('is false when not active', fc.string(), async action => {
      expect(await allowIfAdmin(emptyContext, { action })).toEqual(
        deny(`Cannot perform the specified action "${action}". Only admins can.`),
      );
    });

    it('is true when active', async () => {
      expect(await allowIfAdmin(adminContext, { action: 'testAction' })).toEqual(allow());
    });
  });

  describe('.allowIfHasAllCapabilities', () => {
    itProp(
      'is false when the principal does not have ALL capabilities',
      [
        fc.string(),
        fc.string(),
        fc.constantFrom(
          ['canPerformD'],
          ['canPerformE'],
          ['canPerformD', 'canPerformE'],
          ['canPerformA', 'canPerformB', 'canPerformC', 'canPerformD', 'canPerformE'],
        ),
      ],
      async (action, resource, requiredCapabilityIds) => {
        const missingCapabilities = _.difference(
          requiredCapabilityIds,
          userContextWithCapabilities.principal.capabilityIds,
        );
        expect(
          // The following should result in "deny" because the user does not have the 'canPerformD' and 'canPerformE' capabilities
          await allowIfHasAllCapabilities(userContextWithCapabilities, { action, resource }, requiredCapabilityIds),
        ).toEqual(
          deny(
            `Cannot ${action} ${resource || 'resource'}. The user does not have ${_.join(
              missingCapabilities,
              ', ',
            )} capabilities required to perform ${action}`,
          ),
        );
      },
    );

    itProp(
      'is true when the principal has ALL capabilities',
      [
        fc.string(),
        fc.string(),
        fc.constantFrom(
          ['canPerformA'],
          ['canPerformB'],
          ['canPerformC'],
          ['canPerformA', 'canPerformB'],
          ['canPerformB', 'canPerformC'],
          ['canPerformA', 'canPerformC'],
          ['canPerformA', 'canPerformB', 'canPerformC'],
        ),
      ],
      async (action, resource, requiredCapabilityIds) => {
        expect(
          // The following should result in "allow" because the user has all the required capabilities "canPerformA","canPerformB", and "canPerformC"
          await allowIfHasAllCapabilities(userContextWithCapabilities, { action, resource }, requiredCapabilityIds),
        ).toEqual(allow());
      },
    );
  });

  describe('.allowIfHasAnyCapability', () => {
    itProp(
      'is false when the principal does not have any capabilities',
      [fc.string(), fc.string(), fc.constantFrom(['canPerformD'], ['canPerformE'], ['canPerformD', 'canPerformE'])],
      async (action, resource, requiredCapabilityIds) => {
        expect(
          // The following should result in "deny" because the user does not have the 'canPerformD' and 'canPerformE' capabilities
          await allowIfHasAnyCapability(userContextWithCapabilities, { action, resource }, requiredCapabilityIds),
        ).toEqual(
          deny(
            `Cannot ${action} ${resource ||
              'resource'}. The user does not have any required capabilities to perform ${action}`,
          ),
        );
      },
    );

    itProp(
      'is true when the principal has at least one capability',
      [
        fc.string(),
        fc.string(),
        fc.constantFrom(
          ['canPerformD', 'canPerformA'],
          ['canPerformE', 'canPerformB'],
          ['canPerformD', 'canPerformE', 'canPerformC'],
          ['canPerformD', 'canPerformE', 'canPerformA', 'canPerformB', 'canPerformC'],
        ),
      ],
      async (action, resource, requiredCapabilityIds) => {
        expect(
          // The following should result in "allow" because the user has all the required capabilities "canPerformA","canPerformB", and "canPerformC"
          await allowIfHasAnyCapability(userContextWithCapabilities, { action, resource }, requiredCapabilityIds),
        ).toEqual(allow());
      },
    );
  });

  describe('.isAllow', () => {
    itProp('is true when the effect is allow', fc.constantFrom('allow', 'AlLoW'), str => {
      expect(isAllow({ effect: str })).toBe(true);
    });
    itProp('is false when the effect is not allow', fc.string(), str => {
      fc.pre(_.toLower(str) !== 'allow');
      expect(isAllow({ effect: str })).toBe(false);
    });
  });

  describe('.isDeny', () => {
    itProp('is true when the effect is deny', fc.constantFrom('deny', 'DeNy'), str => {
      expect(isDeny({ effect: str })).toBe(true);
    });
    itProp('is false when the effect is not deny', fc.string(), str => {
      fc.pre(_.toLower(str) !== 'deny');
      expect(isDeny({ effect: str })).toBe(false);
    });
  });
});
