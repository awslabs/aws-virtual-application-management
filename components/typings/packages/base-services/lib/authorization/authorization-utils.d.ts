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

import { RequestContext } from '@aws-ee/base-services-container';
import { AuthorizationResult } from './authorization-result';

export function allow(): AuthorizationResult;
export function deny(message: any, safe?: boolean): AuthorizationResult;
export function allowIfCreatorOrAdmin(
  requestContext: RequestContext,
  {
    action,
    resource,
  }: {
    action: any;
    resource: any;
  },
  item: any,
): Promise<AuthorizationResult>;
export function allowIfCurrentUserOrAdmin(
  requestContext: RequestContext,
  {
    action,
  }: {
    action: any;
  },
  {
    uid,
  }: {
    uid: any;
  },
): Promise<AuthorizationResult>;
export function allowIfCurrentUser(
  requestContext: RequestContext,
  {
    action,
  }: {
    action: any;
  },
  {
    uid,
  }: {
    uid: any;
  },
): Promise<AuthorizationResult>;
export function allowIfActive(
  requestContext: RequestContext,
  {
    action,
  }: {
    action: any;
  },
): Promise<AuthorizationResult>;
export function allowIfAdmin(
  requestContext: RequestContext,
  {
    action,
  }: {
    action: any;
  },
): Promise<AuthorizationResult>;
export function allowIfRoot(
  requestContext: RequestContext,
  {
    action,
  }: {
    action: any;
  },
): Promise<AuthorizationResult>;
export function allowIfHasRole(
  requestContext: RequestContext,
  {
    action,
    resource,
  }: {
    action: any;
    resource: any;
  },
  allowedUserRoles: any,
): AuthorizationResult;
export function isAllow(result: AuthorizationResult): boolean;
export function isDeny(result: AuthorizationResult): boolean;
export function isCurrentUserOrAdmin(
  requestContext: RequestContext,
  {
    uid,
  }: {
    uid: any;
  },
): any;
export function isAdmin(requestContext: RequestContext): any;
export function isActive(requestContext: RequestContext): boolean;
export function isRoot(requestContext: RequestContext): boolean;
