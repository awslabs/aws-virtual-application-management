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

import { itProp, fc } from 'jest-fast-check';
import _ from 'lodash/fp';
import { prepare, write } from '../audit-plugin';

describe('audit-plugin', () => {
  describe('prepare', () => {
    itProp(
      'returns parameter unchanged apart from auditEvent.logEventType being set to audit if missing',
      [fc.anything(), fc.anything(), fc.object(), fc.option(fc.anything())],
      async (requestContext, container, auditEvent, maybeLogEventType) => {
        auditEvent = _.set('logEventType')(maybeLogEventType)(auditEvent);
        const requestContextClone = _.cloneDeep(requestContext);
        const containerClone = _.cloneDeep(container);
        const auditEventClone = _.cloneDeep(auditEvent);
        await prepare({ requestContext, container, auditEvent });
        expect(requestContext).toStrictEqual(requestContextClone);
        expect(container).toStrictEqual(containerClone);
        expect(auditEvent).toStrictEqual(
          maybeLogEventType ? auditEventClone : _.set('logEventType')('audit')(auditEventClone),
        );
      },
    );
  });

  describe('write', () => {
    itProp(
      'returns parameter unchanged and logs audit event to container log',
      [fc.anything(), fc.object(), fc.anything()],
      async (requestContext, container, auditEvent) => {
        const log = jest.fn();
        container = _.set('find')(() => {
          return { log };
        })(container);
        const requestContextClone = _.cloneDeep(requestContext);
        const containerClone = _.cloneDeep(container);
        const auditEventClone = _.cloneDeep(auditEvent);
        await write({ requestContext, container, auditEvent });
        expect(requestContext).toStrictEqual(requestContextClone);
        expect(container).toStrictEqual(containerClone);
        expect(auditEvent).toStrictEqual(auditEventClone);
        expect(log).toHaveBeenCalledWith(auditEventClone);
      },
    );
  });
});
