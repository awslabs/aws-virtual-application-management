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

import { Service } from "@aws-ee/base-services-container";

export default AuditWriterService;
/**
 * Main audit logging writer service implementation that provides a standard interface for writing audit logs.
 * The service is only responsible for writing audit events.
 */
declare class AuditWriterService extends Service {
    init(): Promise<void>;
    pluginRegistryService: any;
    /**
     * Audit method responsible for writing the specified audit event. The method calls plugins for the "audit" extension
     * point. Plugins are called and awaited in the same order as returned by the plugin registry.
     *
     * The method first prepares the given event by calling the "prepare" method of the plugins. Each plugin gets a chance
     * to contribute to preparing the given audit event. The plugins can return the given audit event as is or modify it
     * and return prepared audit event. The audit event returned by the last plugin from the "prepare" method is used as
     * the effective audit event.
     *
     * After audit event is prepared, it writes the audit event by calling the "write" method of the plugins. Each plugin
     * gets a chance to write the given audit event to their respective persistent layer.
     *
     * The method returns a promise that resolves only after all plugins for "audit" extension point are resolved
     * (i.e., after the event has been written by all audit writer plugins). If any plugin throws an error, the method
     * stops calling further plugins and fails (i.e., returns a Promise that rejects with the same error).
     *
     * @param requestContext The request context object containing principal (caller) information.
     * The principal's identifier object is expected to be available as "requestContext.principalIdentifier"
     *
     * @param auditEvent The audit event.
     * @param auditEvent.action The action that is being audited.
     * @param auditEvent.body The body containing some information about the audit event. The body can be any javascript
     * object containing extra information about the audit event.
     * @param auditEvent.message Optional user friendly string message. This defaults to "auditEvent.action", if missing.
     * @param auditEvent.actor Optional JavaScript object containing information about the actor who is performing the
     * specified action. This defaults to the "requestContext.principalIdentifier" and should NOT be specified in most
     * cases.
     * @param auditEvent.timestamp Optional timestamp when the event occurred. This defaults to current time. The
     * "auditEvent.timestamp" is in Epoch Unix timestamp format.
     *
     * @param args Additional arguments to pass to the plugins for the "audit" extension point.
     *
     * @returns {Promise<{auditEvent: *, status: string}>}
     */
    write(requestContext: any, auditEvent: any, ...args: any[]): Promise<{
        auditEvent: any;
        status: string;
    }>;
    /**
     * This method is very similar to the {@link write} method. The method also calls plugins for the "audit" extension
     * point. Plugins are called and awaited in the same order as returned by the plugin registry.
     * The main differences are:
     * - The method fires writing audit event using the plugins and returns right away. The method returns a Promise that
     * resolve immediately (i.e., does not wait for all plugins to finish writing)
     * - In case, any plugin fails writing audit event, the method ignores that error and continues invoking other plugins
     * from the plugin registry (for the "audit" extension point).
     *
     * @param requestContext
     * @param auditEvent
     * @param args
     * @returns {Promise<{status: string}>}
     */
    writeAndForget(requestContext: any, auditEvent: any, ...args: any[]): Promise<{
        status: string;
    }>;
    writeAuditEvent(requestContext: any, auditEvent: any, continueOnError: any, ...args: any[]): Promise<{
        status: string;
        auditEvent: any;
    }>;
    prepareAuditEvent(requestContext: any, auditEvent: any, continueOnError: any, ...args: any[]): Promise<any>;
}
