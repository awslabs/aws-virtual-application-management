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

import Service from './service';

/**
 * First of all, a services container has nothing to do with Docker.
 *
 * A services container is simply an instance of a JavaScript class that runs inside a node.js unix process.
 *
 * It is a container of services that has two main responsibilities:
 * - A registry for the Service class instances.
 * - Initializing the services on demand.
 *
 * This is a low level class that you usually do not interact with directly with the exception of calling
 * the `register()` method. Higher level abstractions, such as the API Framework and the Service class, hide most of the
 * interactions with this class from the rest of your service classes.
 *
 * **Usage**
 *
 * ![Services Container Usage](images/services-container-usage.jpg)
 */
declare class ServicesContainer {
  /**
   * @param roots An array listing all of the root dependencies that are automatically added to all the services.
   *
   * An example:
   *
   * ```
   * const container = new ServicesContainer(['settings', 'log']);
   * ```
   */
  constructor(roots?: string[]);
  isRoot(name: string): boolean;
  /**
   * Register a service with the container.
   *
   * @param name The name of the service to register
   * @param instance The instance of the service to register
   * @param [options] An object containing the option values
   * @param [options.lazy=true] True if the service should be initialized lazily
   *
   *
   * An example:
   *
   * ```
   * container.register('user', <user service class instance>, { lazy: false });
   * ```
   */
  register(name: string, instance: Service, options?: { lazy?: boolean }): void;
  /**
   * Initialize the services that are marked with lazy = false.
   */
  initServices(): Promise<
    {
      name: string;
      instance: Service;
    }[]
  >;
  /**
   * Gain access to a service. Returns `undefined` if the service is not found. Throws an exception if you call `find` before the `initServices` was called.
   *
   * An example:
   * ```
   * const userService = await container.find('ns:user);
   * ```
   *
   * @param name The name of the service that you want to lookup and gain access to.
   */
  find<T>(name: string): Promise<T | undefined>;
  /**
   * Validates that there is no circular dependencies and returns a list of service names sorted according to the dependency order.
   * - Throws an exception if there is a circular dependency.
   * - Throws an exception if a dependency is missing (not applicable for optional dependencies)
   *
   * An example:
   * ```
   * const list = container.validate();
   * // list might contain elements as follows:
   * // [ 'settings', 'user ]
   * ```
   */
  validate(): string[];
}
export default ServicesContainer;
