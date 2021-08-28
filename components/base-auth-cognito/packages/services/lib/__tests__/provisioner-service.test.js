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

import { authenticationProviders as authProviderConstants } from '@aws-ee/base-api-services';

import aws from '../__mocks__/aws.mock';
import ServicesContainerMock from '../__mocks__/services-container.mock';
import SettingsServiceMock from '../__mocks__/settings-service.mock';
import ProvisionerService from '../provisioner-service';

const settings = {
  awsRegion: 'mockRegion',
  envName: 'mockEnvName',
  envType: 'mockEnvType',
  solutionName: 'mockSolutionName',
};

const userPoolId = 'mockUserPool';
const websiteUrl = 'mockWebsiteUrl';
const userPoolDomainPrefix = `${settings.envName}-${settings.envType}-${settings.solutionName}`;

class AuthenticationProviderConfigServiceMock {
  getAuthenticationProviderConfig() {
    return this.provider;
  }

  saveAuthenticationProviderConfig({ providerTypeConfig, providerConfig, status }) {
    const item = { config: { ...providerConfig, type: providerTypeConfig }, status };
    this.provider = item;
    return item;
  }
}

describe('ProvisionerService', () => {
  let sut;
  let container;
  let jsonSchemaValidationService;

  beforeEach(async done => {
    sut = new ProvisionerService();
    jsonSchemaValidationService = { ensureValid: jest.fn().mockResolvedValue() };
    container = new ServicesContainerMock({
      sut,
      log: { info: jest.fn() },
      settings: new SettingsServiceMock(settings),
      aws,
      jsonSchemaValidationService,
      authenticationProviderConfigService: new AuthenticationProviderConfigServiceMock(),
    });
    await container.initServices();
    done();
  });

  describe('.provision', () => {
    it('throws when no action is given', async done => {
      try {
        await sut.provision({});
      } catch (err) {
        expect(err.message.includes('Missing required parameter "action"')).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    it('tests schema validity', async done => {
      try {
        jsonSchemaValidationService.ensureValid.mockRejectedValue('Invalid Schema');
        await sut.provision({
          action: authProviderConstants.provisioningAction.create,
          providerConfig: { websiteUrl },
        });
      } catch (err) {
        expect(err).toBe('Invalid Schema');
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    it('cannot update a non-existing provider', async done => {
      try {
        await sut.provision({
          action: authProviderConstants.provisioningAction.update,
          providerConfig: { id: 'nonexistent', websiteUrl },
        });
      } catch (err) {
        expect(err.message.includes('Cannot update')).toBe(true);
        expect(err.status).toBe(400);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    it('provisions successfully', async done => {
      const result = await sut.provision({
        action: authProviderConstants.provisioningAction.create,
        providerConfig: {
          id: 'testprovider',
          userPoolId,
          clientId: 'mockUserPoolClient',
          websiteUrl,
          userPoolDomainPrefix,
        },
      });
      expect(result).toEqual({
        config: {
          clientId: 'mockUserPoolClient',
          id: 'https://cognito-idp.mockRegion.amazonaws.com/mockUserPool',
          signInUri: `https://mockenvname-mockenvtype-mocksolutionname.auth.mockregion.amazoncognito.com/oauth2/authorize?response_type=token&client_id=mockUserPoolClient&redirect_uri=${websiteUrl}`,
          signOutUri: `https://mockenvname-mockenvtype-mocksolutionname.auth.mockregion.amazoncognito.com/logout?client_id=mockUserPoolClient&logout_uri=${websiteUrl}`,
          type: sut.providerConfig,
          userPoolDomainPrefix: 'mockEnvName-mockEnvType-mockSolutionName',
          userPoolId: 'mockUserPool',
          websiteUrl,
        },
        status: 'active',
      });
      done();
    });

    describe('with created provider', () => {
      beforeEach(async done => {
        await sut.provision({
          action: authProviderConstants.provisioningAction.create,
          providerConfig: { id: 'testprovider', websiteUrl },
        });
        done();
      });

      it('does not create the same pool again', async done => {
        try {
          await sut.provision({
            action: authProviderConstants.provisioningAction.create,
            providerConfig: { id: 'testprovider', websiteUrl },
          });
        } catch (err) {
          expect(err.message.includes('An authentication provider with the same id already exists')).toBe(true);
          expect(err.status).toBe(400);
          expect(err.safe).toBe(true);
          done();
          return;
        }
        throw new Error('Expected an exception');
      });
    });
  });
});
