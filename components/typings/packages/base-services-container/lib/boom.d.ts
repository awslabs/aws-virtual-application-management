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

import BoomError from './boom-error';

declare class Boom {
  badRequest(msg?: string | Error, safe?: boolean): BoomError;
  concurrentUpdate(msg?: string | Error, safe?: boolean): BoomError;
  unauthorized(msg?: string | Error, safe?: boolean): BoomError;
  forbidden(msg?: string | Error, safe?: boolean): BoomError;
  invalidToken(msg?: string | Error, safe?: boolean): BoomError;
  notFound(msg?: string | Error, safe?: boolean): BoomError;
  alreadyExists(msg?: string | Error, safe?: boolean): BoomError;
  outdatedUpdateAttempt(msg?: string | Error, safe?: boolean): BoomError;
  timeout(msg?: string | Error, safe?: boolean): BoomError;
  badImplementation(msg?: string | Error, safe?: boolean): BoomError;
  internalError(msg?: string | Error, safe?: boolean): BoomError;

  extend(...arr: [string, number][]): void;
  is(error: Error, code: string): boolean;
  code(error: Error): string;
}
export default Boom;
