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

/* eslint-disable no-await-in-loop */
// const _ = require('lodash');
import { Service } from '@aws-ee/base-services-container';
import { allowIfActive /* , allowIfAdmin */ } from '@aws-ee/base-services';

// const helloMessagesSchema = require('../schema/hello-messages'); // your input schema

// See ../plugins/services-plugin.js for an example of how to register this service
class HelloService extends Service {
  constructor() {
    super();
    this.dependency(['jsonSchemaValidationService', 'authorizationService', 'auditWriterService']);
  }

  async init() {
    await super.init();
    // If you need to do any initialization, do it here
  }

  async getHelloMessages(requestContext, rawData) {
    // Do your input validation here (if this method accepts input)
    // const [validationService] = await this.service(['jsonSchemaValidationService']);
    // await validationService.ensureValid(rawData, helloMessagesSchema);

    // Do your authorization checks here. For example, below is an authorization assertion
    // where the user has to be active and an admin.
    await this.assertAuthorized(
      requestContext,
      { action: 'sayHello', conditions: [allowIfActive /* , allowIfAdmin */] },
      rawData,
    );

    // This is just an example result.
    const result = [
      { message: 'hello world' },
      { message: 'Bonjour le monde' }, // French
      { message: 'Hallo Welt' }, // German
      { message: 'Hej Verden' }, // Danish
    ];

    // Write audit event
    await this.audit(requestContext, { action: 'sayHello', body: result });

    return result;
  }

  async assertAuthorized(requestContext, { action, conditions }, ...args) {
    const authorizationService = await this.service('authorizationService');

    // The "authorizationService.assertAuthorized" below will evaluate permissions by calling the "conditions" functions first
    // It will then give a chance to all registered plugins (if any) to perform their authorization.
    // The plugins can even override the authorization decision returned by the conditions
    // See "authorizationService.authorize" method for more details
    // NOTE: if you don't want to have an extension point for this, you can remove the extensionPoint property
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'sample-extension', action, conditions },
      ...args,
    );
  }
}

export default HelloService;
