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

export interface AuthorizationResultAllow {
  effect: 'allow';
}

export interface AuthorizationResultDeny {
  effect: 'deny';
  reason: {
    message: string;
    safe: boolean;
  };
}

export type AuthorizationResult = AuthorizationResultAllow | AuthorizationResultDeny;

export interface AuthorizationTarget {
  action: string;
  resource?: string;
}

export interface AuthorizationOptions extends AuthorizationTarget {
  extensionPoint: string;
  conditions: AuthorizerFn | AuthorizerFn[];
}

export type AuthorizerFn = (...args: any[]) => AuthorizationResult | Promise<AuthorizationResult>;
