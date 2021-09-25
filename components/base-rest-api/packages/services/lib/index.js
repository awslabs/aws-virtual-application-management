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

// Auth Provider Configs
export { default as AuthenticationProviderConfigService } from './authentication-providers/authentication-provider-config-service';
export { default as AuthenticationProviderTypeService } from './authentication-providers/authentication-provider-type-service';

export * from './authentication-providers/constants';
export * from './authentication-providers/helpers/invoker';
export * from './authentication-providers/helpers/resolver';

export { default as AuthenticationService } from './authentication-service';
export { default as JwtService } from './jwt-service';
export { default as TokenRevocationService } from './token-revocation-service';
export { default as TokenSwapperService } from './token-swapper-service';
