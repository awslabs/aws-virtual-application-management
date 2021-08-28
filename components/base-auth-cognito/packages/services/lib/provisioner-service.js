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

import { authenticationProviders as authProviderConstants } from '@aws-ee/base-api-services';
import { Service } from '@aws-ee/base-services-container';

import cognitoProviderConfig from './metadata/provider-config';

const settingKeys = { awsRegion: 'awsRegion' };

class CognitoProvisionerService extends Service {
  constructor() {
    super();
    this.dependency(['aws', 's3Service', 'jsonSchemaValidationService', 'authenticationProviderConfigService']);
    this.boom.extend(['authProviderAlreadyExists', 400]);
    this.boom.extend(['noAuthProviderFound', 400]);
  }

  get providerConfig() {
    return cognitoProviderConfig;
  }

  async provision({ providerConfig, action }) {
    if (!action) {
      throw this.boom.badRequest('Can not provision Cognito User Pool. Missing required parameter "action"', false);
    }

    this.log.info('Provisioning Cognito User Pool Authentication Provider');

    // Validate input
    const jsonSchemaValidationService = await this.service('jsonSchemaValidationService');
    const providerConfigJsonSchema = this.providerConfig.config.inputSchema;
    await jsonSchemaValidationService.ensureValid(providerConfig, providerConfigJsonSchema);

    const authenticationProviderConfigService = await this.service('authenticationProviderConfigService');
    let existingProviderConfig;
    if (providerConfig.id) {
      existingProviderConfig = await authenticationProviderConfigService.getAuthenticationProviderConfig(
        providerConfig.id,
      );
    }
    if (action === authProviderConstants.provisioningAction.create && !_.isNil(existingProviderConfig)) {
      // The authentication provider with same config id already exists.
      throw this.boom.authProviderAlreadyExists(
        'Cannot create the specified authentication provider. An authentication provider with the same id already exists',
        true,
      );
    }
    if (action === authProviderConstants.provisioningAction.update && _.isNil(existingProviderConfig)) {
      // The authentication provider with the specified config id does not exist.
      throw this.boom.noAuthProviderFound(
        'Cannot update the specified authentication provider. No authentication provider with the specified id found',
        true,
      );
    }

    // Update the user pool client with enabled IdPs
    await this.configureCognitoIdentityProviders(providerConfig);
    await this.updateUserPoolClient(providerConfig);

    // Build sign-in and sign-out URIs
    const awsRegion = this.settings.get(settingKeys.awsRegion);
    const baseAuthUri = `https://${providerConfig.userPoolDomainPrefix}.auth.${awsRegion}.amazoncognito.com`;

    const signInUri = new URL('/oauth2/authorize', baseAuthUri);
    signInUri.searchParams.set('response_type', 'token');
    signInUri.searchParams.set('client_id', providerConfig.clientId);
    signInUri.searchParams.set('redirect_uri', providerConfig.websiteUrl);

    const signOutUri = new URL('/logout', baseAuthUri);
    signOutUri.searchParams.set('client_id', providerConfig.clientId);
    signOutUri.searchParams.set('logout_uri', providerConfig.websiteUrl);

    // Save auth provider configuration and make it active
    this.log.info('Saving Cognito User Pool Authentication Provider Configuration.');

    const result = await authenticationProviderConfigService.saveAuthenticationProviderConfig({
      providerTypeConfig: this.providerConfig,
      providerConfig: {
        ...providerConfig,
        id: `https://cognito-idp.${awsRegion}.amazonaws.com/${providerConfig.userPoolId}`,
        signInUri: signInUri.toString(),
        signOutUri: signOutUri.toString(),
      },
      status: authProviderConstants.status.active,
    });
    return result;
  }

  /* ************** Provisioning Steps ************** */
  async updateUserPoolClient(providerConfig) {
    this.log.info('Updating Cognito User Pool Client');

    const aws = await this.service('aws');
    const cognitoIdentityServiceProvider = new aws.sdk.CognitoIdentityServiceProvider();

    // At this point the cognito client should have already been created.
    const result = await cognitoIdentityServiceProvider
      .describeUserPoolClient({
        ClientId: providerConfig.clientId,
        UserPoolId: providerConfig.userPoolId,
      })
      .promise();
    const existingClientConfig = result.UserPoolClient;

    let supportedIdpNames = [];
    if (!_.isEmpty(providerConfig.federatedIdentityProviders)) {
      // federatedIdentityProviders are provided so assume SAML federation
      //
      // federatedIdentityProviders -- an array of federated identity provider info objects with following shape
      // [{
      //    id: 'some-id-of-the-idp' (such as 'com.amazonaws' etc. The usual practice is to keep this same as the domain name of the idp.)
      //    name: 'some-idp-name' (such as 'com.amazonaws', 'AmazonAWSEmployees' etc)
      //    displayName: 'some-displayable-name-for-the-idp' (such as 'Internal Users', 'External Users' etc)
      //    metadata: 'SAML XML Metadata blob for the identity provider or a URI pointing to a location that will provide the SAML metadata'
      // }]
      const idpNames = _.map(providerConfig.federatedIdentityProviders, idp => idp.name);
      supportedIdpNames = idpNames;
    }

    // Enable Cognito as an auth provider for the app client if configured
    if (providerConfig.enableNativeUserPoolUsers) {
      supportedIdpNames.push('COGNITO');
    }

    const params = {
      ClientId: existingClientConfig.ClientId,
      UserPoolId: existingClientConfig.UserPoolId,
      AllowedOAuthFlows: existingClientConfig.AllowedOAuthFlows,
      AllowedOAuthFlowsUserPoolClient: existingClientConfig.AllowedOAuthFlowsUserPoolClient,
      AllowedOAuthScopes: existingClientConfig.AllowedOAuthScopes,
      CallbackURLs: existingClientConfig.CallbackURLs,
      ClientName: existingClientConfig.ClientName,
      DefaultRedirectURI: existingClientConfig.DefaultRedirectURI,
      ExplicitAuthFlows: existingClientConfig.ExplicitAuthFlows,
      LogoutURLs: existingClientConfig.LogoutURLs,
      ReadAttributes: existingClientConfig.ReadAttributes,
      RefreshTokenValidity: existingClientConfig.RefreshTokenValidity,
      WriteAttributes: existingClientConfig.WriteAttributes,
      SupportedIdentityProviders: supportedIdpNames,
    };

    // Update Cognito app client
    await cognitoIdentityServiceProvider.updateUserPoolClient(params).promise();
  }

  async configureCognitoIdentityProviders(providerConfig) {
    // federatedIdentityProviders -- an array of federated identity provider info objects with following shape
    // [{
    //    id: 'some-id-of-the-idp' (such as 'com.amazonaws' etc. The usual practice is to keep this same as the domain name of the idp.
    //    For example, when connecting with an IdP that has users "user1@domain1.com", "user2@domain1.com" etc then the "id" should
    //    be set to "domain1.com")
    //
    //    name: 'some-idp-name' (such as 'com.amazonaws', 'AmazonAWSEmployees' etc)
    //
    //    displayName: 'some-displayable-name-for-the-idp' (such as 'Internal Users', 'External Users' etc)
    //
    //    metadata: 'SAML XML Metadata blob for the identity provider or a URI pointing to a location that will provide the SAML metadata'
    //
    //    disableIdpSignout [optional boolean]: If true, when user hits Logout button, we will NOT attempt to log them out from the IdP
    //                                          (by default, when not passed, we will try to sign out of the IdP too)
    //
    // }]
    // TODO: Remove providers that were previously configured but have been removed
    if (_.isEmpty(providerConfig.federatedIdentityProviders)) {
      // No IdPs to add. Just exit.
      return;
    }

    this.log.info('Configuring Cognito Identity Providers');
    const aws = await this.service('aws');
    const cognitoIdentityServiceProvider = new aws.sdk.CognitoIdentityServiceProvider();

    const idpCreationPromises = _.map(providerConfig.federatedIdentityProviders, async idp => {
      let metadata = idp.metadata;

      if (metadata.startsWith('s3://')) {
        const s3Service = await this.service('s3Service');
        const { s3BucketName, s3Key } = s3Service.parseS3Details(metadata);
        const result = await s3Service.api.getObject({ Bucket: s3BucketName, Key: s3Key }).promise();
        metadata = result.Body.toString('utf8');
      }

      const metaDataInfo = {};
      // double-negative as the option was added later, and it preserves the default
      if (idp.disableIdpSignout !== true) {
        metaDataInfo.IDPSignout = 'true';
      }
      if (/^https?:\/\//.test(metadata)) {
        metaDataInfo.MetadataURL = metadata;
      } else {
        metaDataInfo.MetadataFile = metadata;
      }

      const params = {
        ProviderDetails: metaDataInfo,
        ProviderName: idp.name /* required */,
        ProviderType: 'SAML' /* required */,
        UserPoolId: providerConfig.userPoolId /* required */,
        AttributeMapping: {
          // TODO: Add support for configurable attributes mapping
          name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
          given_name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
          family_name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
          email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        },
        IdpIdentifiers: [idp.id],
      };

      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#createIdentityProvider-property
      try {
        await cognitoIdentityServiceProvider.createIdentityProvider(params).promise();
      } catch (err) {
        if (err.code === 'DuplicateProviderException') {
          // the identity provider already exists so update it instead of creating it
          await cognitoIdentityServiceProvider
            .updateIdentityProvider({
              ProviderName: params.ProviderName,
              UserPoolId: params.UserPoolId,
              AttributeMapping: params.AttributeMapping,
              IdpIdentifiers: params.IdpIdentifiers,
              ProviderDetails: params.ProviderDetails,
            })
            .promise();
        } else {
          // In case of any other error just rethrow
          throw err;
        }
      }
    });
    await Promise.all(idpCreationPromises);
  }
}

export default CognitoProvisionerService;
