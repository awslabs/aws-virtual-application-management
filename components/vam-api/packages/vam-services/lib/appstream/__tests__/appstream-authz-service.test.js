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

import {
  AuthorizationService,
  AwsService,
  DbService,
  JsonSchemaValidationService,
  PluginRegistryService,
} from '@aws-ee/base-services';

import { ServicesContainer } from '@aws-ee/base-services-container';

import AppstreamAuthzService from '../appstream-authz-service';
import GroupService from '../../group-service';
import GroupAccessService from '../group-access-service';
import GroupAuthzService from '../../group-authz-service';

describe('AppstreamAuthzService', () => {
  let service = null;
  beforeEach(async () => {
    // Initialize services container and register dependencies
    const container = new ServicesContainer();

    container.register('aws', new AwsService());
    container.register('appstreamAuthzService', new AppstreamAuthzService());
    container.register('authorizationService', new AuthorizationService());
    container.register('dbService', new DbService());
    container.register('jsonSchemaValidationService', new JsonSchemaValidationService());
    container.register('pluginRegistryService', new PluginRegistryService());
    container.register('groupAuthzService', new GroupAuthzService());
    container.register('groupService', new GroupService());
    container.register('groupAuthzService', new GroupAuthzService());
    container.register('groupAccessService', new GroupAccessService());
    await container.initServices();

    // Get instance of the service we are testing
    service = await container.find('appstreamAuthzService');
  });

  const poweruserContext = {
    principal: {
      status: 'active',
      isAdmin: false,
      userRole: 'poweruserRole',
    },
  };

  const adminContext = {
    principal: {
      status: 'active',
      isAdmin: true,
      userRole: 'admin',
    },
  };

  const nonGuestContext = {
    principal: {
      status: 'active',
      isAdmin: false,
      userRole: 'poweruserRole',
    },
  };

  const userContext = {
    principal: {
      status: 'active',
      isAdmin: false,
      userRole: 'user',
    },
  };

  const guestContext = {
    principal: {
      status: 'active',
      isAdmin: false,
      userRole: 'guest',
    },
  };

  const inactiveAdminContext = {
    principal: {
      status: 'inactive',
      isAdmin: true,
      userRole: 'admin',
    },
  };

  describe('guest vs non-guest', () => {
    const actions = [
      AppstreamAuthzService.LIST_APPLICATIONS,
      AppstreamAuthzService.LIST_IMAGE_BUILDERS,
      AppstreamAuthzService.LIST_FLEETS,
      AppstreamAuthzService.LIST_DYNAMIC_CATALOGS,
      AppstreamAuthzService.GET_FLEET,
    ];

    test.each(actions)('should allow non-guests when accessing %s', async action => {
      const result = await service.authorize(nonGuestContext, { action }, {});
      expect(result).toMatchObject({ effect: 'allow' });
    });

    test.each(actions)('should deny guests when accessing %s', async action => {
      const result = await service.authorize(guestContext, { action }, {});
      expect(result).toMatchObject({ effect: 'deny' });
    });
  });

  describe('admin only', () => {
    const actions = [
      AppstreamAuthzService.CREATE_IMAGE,
      AppstreamAuthzService.LIST_IMAGES,
      AppstreamAuthzService.DELETE_IMAGE,
    ];

    test.each(actions)('should allow admins when accessing %s', async action => {
      const result = await service.authorize(adminContext, { action }, {});
      expect(result).toMatchObject({ effect: 'allow' });
    });

    test.each(actions)('should deny powerusers when accessing %s', async action => {
      const result = await service.authorize(poweruserContext, { action }, {});
      expect(result).toMatchObject({ effect: 'deny' });
    });

    test.each(actions)('should deny users when accessing %s', async action => {
      const result = await service.authorize(userContext, { action }, {});
      expect(result).toMatchObject({ effect: 'deny' });
    });

    test.each(actions)('should deny guests when accessing %s', async action => {
      const result = await service.authorize(guestContext, { action }, {});
      expect(result).toMatchObject({ effect: 'deny' });
    });
  });

  describe('poweruser + admin vs not', () => {
    const actions = [
      AppstreamAuthzService.SHARE_IMAGE,
      AppstreamAuthzService.REVOKE_IMAGE_SHARING,
      AppstreamAuthzService.CREATE_FLEET,
      AppstreamAuthzService.SWAP_IMAGE,
    ];

    test.each(actions)('should allow powerusers when accessing %s', async action => {
      const result = await service.authorize(poweruserContext, { action }, {});
      expect(result).toMatchObject({ effect: 'allow' });
    });

    test.each(actions)('should allow admins when accessing %s', async action => {
      const result = await service.authorize(adminContext, { action }, {});
      expect(result).toMatchObject({ effect: 'allow' });
    });

    test.each(actions)('should deny users when accessing %s', async action => {
      const result = await service.authorize(userContext, { action }, {});
      expect(result).toMatchObject({ effect: 'deny' });
    });

    test.each(actions)('should deny guests when accessing %s', async action => {
      const result = await service.authorize(guestContext, { action }, {});
      expect(result).toMatchObject({ effect: 'deny' });
    });
  });

  describe('poweruser + group members vs not', () => {
    const actions = [
      AppstreamAuthzService.START_FLEET,
      AppstreamAuthzService.STOP_FLEET,
      AppstreamAuthzService.DELETE_FLEET,
      AppstreamAuthzService.GET_FLEET_LINK,
      AppstreamAuthzService.CREATE_DYNAMIC_CATALOG,
      AppstreamAuthzService.DELETE_DYNAMIC_CATALOG,
    ];

    test.each(actions)('should allow powerusers when accessing %s', async action => {
      const adMock = jest.fn(_requestContext => []);
      service.container.serviceMap.groupService.instance.listForUser = adMock;
      const result = await service.authorize(poweruserContext, { action }, { fleet: 'test', sharedGroups: [] });
      expect(result).toMatchObject({ effect: 'allow' });
    });

    test.each(actions)('should allow group members when accessing %s', async action => {
      const adMock = jest.fn(_requestContext => ['g1']);
      service.container.serviceMap.groupService.instance.listForUser = adMock;
      const result = await service.authorize(userContext, { action }, { fleet: 'test', sharedGroups: ['g1'] });
      expect(result).toMatchObject({ effect: 'allow' });
    });

    test.each(actions)('should deny non group-members when accessing %s', async action => {
      const adMock = jest.fn(_requestContext => []);
      service.container.serviceMap.groupService.instance.listForUser = adMock;
      const result = await service.authorize(userContext, { action }, { fleet: 'test', sharedGroups: ['g1'] });
      expect(result).toMatchObject({ effect: 'deny' });
    });
  });

  describe('poweruser + group members vs not (for group admin)', () => {
    const actions = [AppstreamAuthzService.GRANT_ACCESS_TO_GROUP, AppstreamAuthzService.REVOKE_ACCESS_TO_GROUP];
    const thing = { id: 'FLEET||||test', groupId: 'g1', groupName: 'g1' };

    test.each(actions)('should allow powerusers when accessing %s', async action => {
      const adMock = jest.fn(_requestContext => []);
      service.container.serviceMap.groupService.instance.listForUser = adMock;
      const result = await service.authorize(poweruserContext, { action }, [thing]);
      expect(result).toMatchObject({ effect: 'allow' });
    });

    test.each(actions)('should allow group-members when accessing %s', async action => {
      const adMock = jest.fn(_requestContext => [{ DistinguishedName: 'g1' }]);
      service.container.serviceMap.groupService.instance.listForUser = adMock;
      const result = await service.authorize(userContext, { action }, [thing]);
      expect(result).toMatchObject({ effect: 'allow' });
    });

    test.each(actions)('should deny non group-members when accessing %s', async action => {
      const adMock = jest.fn(_requestContext => []);
      service.container.serviceMap.groupService.instance.listForUser = adMock;
      const result = await service.authorize(userContext, { action }, [thing]);
      expect(result).toMatchObject({ effect: 'deny' });
    });
  });

  describe('"undefined" or "invalid" action', () => {
    const actions = [undefined, 'try-to-take-over-the-world-unknown-action'];
    test.each(actions)('should deny admin when accessing %s', async action => {
      const adMock = jest.fn(_requestContext => []);
      service.container.serviceMap.groupService.instance.listForUser = adMock;
      const result = await service.authorize(adminContext, { action }, {});
      expect(result).toMatchObject({ effect: 'deny' });
    });
  });

  describe('inactive admin', () => {
    const actions = [
      AppstreamAuthzService.START_FLEET,
      AppstreamAuthzService.STOP_FLEET,
      AppstreamAuthzService.DELETE_FLEET,
      AppstreamAuthzService.GET_FLEET_LINK,
      AppstreamAuthzService.CREATE_DYNAMIC_CATALOG,
      AppstreamAuthzService.DELETE_DYNAMIC_CATALOG,
    ];

    test.each(actions)('should deny inactive admin when accessing %s', async action => {
      const adMock = jest.fn(_requestContext => []);
      service.container.serviceMap.groupService.instance.listForUser = adMock;
      const result = await service.authorize(inactiveAdminContext, { action }, {});
      expect(result).toMatchObject({ effect: 'deny' });
    });
  });
});
