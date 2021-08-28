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

import ServicesContainer from './services-container';
import RequestContext from './request-context';
import Boom from './boom';
import { LoggerService } from './logger-service';
import { SettingsService } from './settings-service';

/**
 * This is the base class for any services you write. Here are a few examples of services that extend Service:
 * ```
 * // For a service that does not depend on other services and
 * // does not need any initialization logic and has one method named "doSomething":
 * class SimpleService extends Service {
 *   doSomething() {
 *     // add logic here
 *   }
 * }
 *
 * // A more realistic example:
 * class MyService extends Service {
 *   constructor() {
 *     super(); // don't forget to call the super class
 *
 *     this.dependency(['ns:user', 'ns:aws', 'ns:cache']);
 *     // you are declaring dependency on the user, aws and cache services.
 *     // do not add any initialization logic here, instead you should add your initialization logic in
 *     // the 'init()' method.
 *   }
 *
 *   async init() {
 *     await super.init(); // don't forget to call the super class
 *     const [ user, aws, cache ] = await this.service([ 'user', 'aws', 'cache']);
 *
 *     // you can access a setting like this:
 *     const vpcId = this.settings.get('vpc.id');
 *
 *     // to log a message
 *     this.log.info('This is the init() method of my service');
 *
 *     // do whatever you need using the user, aws, cache
 *     this.log.info(`My name is ${user.getName()}`);
 *   }
 * }
 * ```
 */
declare class Service<B = Boom> {
  /**
   * In general, you want to override the constructor to declare the service dependency by calling `dependency()` from within
   * the constructor method.  However, any other initialization logic should go to the `init()` method.
   * So, keep the following in mind:
   * - You don't have access to any services in the constructor, if you need access to the services
   * then move your logic to the `init()` method.
   * - You must call the `super()` constructor.
   *
   * For example:
   * ```
   * class MyService extends AnotherService {
   *   constructor() {
   *     super(); // don't forget to call the super class
   *
   *     this.dependency(['user', 'aws', 'cache']);
   *     // you are declaring dependency on the user, aws and cache services.
   *   }
   *
   *   async init() {
   *     await super.init(); // don't forget to call the super class
   *     const [ user, aws, cache ] = await this.service(['user', 'aws', 'cache']);
   *
   *     // now do whatever you need using the user, aws, cache
   *     this.log.info(`My name is ${user.getName()}`);
   *   }
   * }
   * ```
   */
  constructor();
  initService(
    container: ServicesContainer,
    {
      name,
    }: {
      name: string;
    },
  ): Promise<any>;
  /** Writes specified audit event using plugins for the "audit" extension point. Write failure for any plugin is ignored, and
   *  has no impact on other plugins. The returned Promise resolves immediately rather than waiting for plugin execution to complete
   *  @param requestContext context for which to write the audit event
   *  @param auditEvent     audit event to write */
  protected audit(requestContext: RequestContext, auditEvent: any): Promise<{ status: string }>;
  get deps(): Record<string, boolean>;
  get optionalDeps(): Record<string, boolean>;
  /**
   * Override this method to include your initialization code. Keep in mind that this method is async.
   */
  protected init(): Promise<void>;
  /**
   * Gives you access to the boom helper object. You can use this helper to return exceptions that follow
   * the error handling micro pattern.
   *
   * There are a few things you can do with this helper:
   * - You can use one of the existing methods to throw a boom error. There are four built-in error-code based methods:
   *   - `throw this.boom.badRequest('Your internal message goes here');`
   *   - `throw this.boom.forbidden('Your internal message goes here');`
   *   - `throw this.boom.notFound('Your internal message goes here');`
   *   - `throw this.boom.badImplementation('Your internal message goes here');`
   * - If your service needs to use a different error-code based method, you can extend boom in the service constructor and,
   * then, use the newly introduced error-code based method anywhere in your service.  Let's look at an example:
   *
   * ```
   * class MyService extends Service {
   *   constructor() {
   *     super();
   *     this.boom.extend(['dbError', 500], ['snsError', 500]);
   *   }
   *
   *   doSomething() {
   *     throw this.boom.dbError('database is snoozing');
   *     // throw this.boom.snsError('sns is out of whack');
   *   }
   * }
   * ```
   */
  protected get boom(): B;
  /**
   * Gives you access to the settings service. For example:
   * ```
   * const vpcId = this.settings.get('vpc.id');
   * ```
   */
  protected get settings(): SettingsService;
  /**
   * Gives you access to the log service. For example:
   * ```
   * this.log.info('sweet!);
   * ```
   */
  protected get log(): LoggerService;
  /**
   * Gain access to a service or services. If you try to access a service that you did not declare as a dependency,
   * an error is thrown.
   *
   * An example of accessing a service:
   * ```
   * const [user, aws, cache] = await this.service(['ns:user', 'ns:aws', 'ns:cache']);
   * const account = await this.service('ns:account);
   * ```
   *
   * @param {string | Array<string>} nameOrNames the name of the service(s) you need access to
   */
  protected service<T>(name: string): Promise<T>;
  protected service<T1, T2>(names: [string, string]): Promise<[T1, T2]>;
  protected service<T1, T2, T3>(names: [string, string, string]): Promise<[T1, T2, T3]>;
  protected service<T1, T2, T3, T4>(names: [string, string, string, string]): Promise<[T1, T2, T3, T4]>;
  protected service<T1, T2, T3, T4, T5>(names: [string, string, string, string, string]): Promise<[T1, T2, T3, T4, T5]>;
  protected service<T1, T2, T3, T4, T5, T6>(
    names: [string, string, string, string, string, string],
  ): Promise<[T1, T2, T3, T4, T5, T6]>;
  protected service(names: string[]): Promise<unknown[]>;
  /**
   * Gain access to a service or services. If you try to access a service that you did not declare as an optional dependency,
   * an error is thrown.  However, if the service itself is not registered, then `undefined` is returned.
   *
   * An example of accessing a service:
   * ```
   * const [user, aws, cache] = await this.optionalService(['ns:user', 'ns:aws', 'ns:cache']);
   * const account = await this.optionalService('ns:account);
   * ```
   *
   * @param {string | Array<string>} nameOrNames the name of the service(s) you need access to
   */
  protected optionalService<T>(name: string): Promise<T | null>;
  protected optionalService<T1, T2>(names: [string, string]): Promise<[T1?, T2?]>;
  protected optionalService<T1, T2, T3>(names: [string, string, string]): Promise<[T1?, T2?, T3?]>;
  protected optionalService<T1, T2, T3, T4>(names: [string, string, string, string]): Promise<[T1?, T2?, T3?, T4?]>;
  protected optionalService<T1, T2, T3, T4, T5>(
    names: [string, string, string, string, string],
  ): Promise<[T1?, T2?, T3?, T4?, T5?]>;
  protected optionalService<T1, T2, T3, T4, T5, T6>(
    names: [string, string, string, string, string, string],
  ): Promise<[T1?, T2?, T3?, T4?, T5?, T6?]>;
  protected optionalService(names: string[]): Promise<unknown[]>;
  /**
   * Use this method to declare dependency on other services. Call this method inside the constructor of your service.<br/>
   * For example:
   * ```
   * class MyService extends AnotherService {
   *   constructor() {
   *     super(); // important: don't forget to call the constructor of the super class
   *
   *     this.dependency(['ns:user', 'ns:account', 'ns:cache']);
   *     // you are declaring dependency on the user, account and cache services.
   *     // where 'ns' is a string representing the namespace of the service.
   *
   *     // if you just have one dependency
   *     this.dependency('ns:user');
   *   }
   * }
   * ```
   *
   * *NOTE*: You can call `dependency()` anytime before the service is initialized, once the service is initialized, calling
   * `dependency()` will throw an exception.
   *
   * @param deps The dependency name(s), see the description for examples.
   */
  protected dependency(deps?: string | string[]): void;
  /**
   * Use this method to declare optional dependency on other services. Call this method inside the constructor of your service.<br/>
   * For example:
   * ```
   * class MyService extends AnotherService {
   *   constructor() {
   *     super(); // important: don't forget to call the constructor of the super class
   *
   *     this.optionalDependency(['ns:user', 'ns:account', 'ns:cache']);
   *     // you are declaring optional dependency on the user, account and cache services.
   *     // where 'ns' is a string representing the namespace of the service.
   *
   *     // if you just have one dependency
   *     this.optionalDependency('ns:user');
   *   }
   * }
   * ```
   *
   * *NOTE*: You can call `optionalDependency()` anytime before the service is initialized, once the service is initialized, calling
   * `optionalDependency()` will throw an exception.
   *
   * Once you declare a dependency, you can use gain access to it using 'optionalService()'
   *
   * @param deps The optional dependency name(s), see the description for examples.
   */
  protected optionalDependency(deps?: string | string[]): void;
}
export default Service;
