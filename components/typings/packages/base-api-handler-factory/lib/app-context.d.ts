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

import { Express, Router, RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

import { Boom } from '@aws-ee/base-services-container';
import { LoggerService, SettingsService } from '@aws-ee/base-services';

export default AppContext;
declare class AppContext<B = Boom> {
  readonly app: Express;
  readonly settings: SettingsService;
  readonly log: LoggerService;
  readonly boom: B;
  service<T>(name: string): Promise<T>;
  service<T1, T2>(names: [string, string]): Promise<[T1, T2]>;
  service<T1, T2, T3>(names: [string, string, string]): Promise<[T1, T2, T3]>;
  service<T1, T2, T3, T4>(names: [string, string, string, string]): Promise<[T1, T2, T3, T4]>;
  service<T1, T2, T3, T4, T5>(names: [string, string, string, string, string]): Promise<[T1, T2, T3, T4, T5]>;
  service<T1, T2, T3, T4, T5, T6>(
    names: [string, string, string, string, string, string],
  ): Promise<[T1, T2, T3, T4, T5, T6]>;
  service(names: string[]): Promise<unknown[]>;
  optionalService<T>(name: string): Promise<T | null>;
  optionalService<T1, T2>(names: [string, string]): Promise<[T1?, T2?]>;
  optionalService<T1, T2, T3>(names: [string, string, string]): Promise<[T1?, T2?, T3?]>;
  optionalService<T1, T2, T3, T4>(names: [string, string, string, string]): Promise<[T1?, T2?, T3?, T4?]>;
  optionalService<T1, T2, T3, T4, T5>(
    names: [string, string, string, string, string],
  ): Promise<[T1?, T2?, T3?, T4?, T5?]>;
  optionalService<T1, T2, T3, T4, T5, T6>(
    names: [string, string, string, string, string, string],
  ): Promise<[T1?, T2?, T3?, T4?, T5?, T6?]>;
  optionalService(names: string[]): Promise<unknown[]>;
  wrap<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = Query,
    Locals extends Record<string, any> = Record<string, any>,
  >(fn: RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>): RequestHandler;
  router(): Router;
}
