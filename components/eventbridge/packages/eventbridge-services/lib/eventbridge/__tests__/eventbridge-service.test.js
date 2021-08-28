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

import _ from 'lodash';
import { ServicesContainer } from '@aws-ee/base-services-container';
import { JsonSchemaValidationService, PluginRegistryService } from '@aws-ee/base-services';

import EventBridgeService from '../eventbridge-service';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';

const settings = {
  solutionEventBusName: 'mock-solution-bus',
};

const authzExtensionPoint = 'eventbridge-authz';

describe('EventBridgeService', () => {
  let sut;
  let logServiceMock;
  let awsServiceMock;
  let eventBridgeClientMock;
  let authorizationServiceMock;
  let auditWriterServiceMock;

  beforeEach(async () => {
    const container = new ServicesContainer();

    logServiceMock = {
      initService: jest.fn(),
      error: jest.fn(),
    };

    eventBridgeClientMock = {
      putRule: jest.fn(),
      deleteRule: jest.fn(),
      putTargets: jest.fn(),
      removeTargets: jest.fn(),
      putEvents: jest.fn(),
    };

    awsServiceMock = {
      initService: jest.fn(),
      sdk: {
        EventBridge: jest.fn().mockImplementation(() => {
          return eventBridgeClientMock;
        }),
      },
    };

    authorizationServiceMock = {
      initService: jest.fn(),
      assertAuthorized: jest.fn(),
    };

    auditWriterServiceMock = {
      initService: jest.fn(),
      writeAndForget: jest.fn(),
    };

    container.register('log', logServiceMock);
    container.register('settings', new SettingsServiceMock(settings));
    container.register('aws', awsServiceMock);
    container.register('authorizationService', authorizationServiceMock);
    container.register('auditWriterService', auditWriterServiceMock);
    container.register('pluginRegistryService', new PluginRegistryService({ getPlugins: () => [] }), { lazy: false });
    container.register('jsonSchemaValidationService', new JsonSchemaValidationService());

    container.register('sut', new EventBridgeService());

    await container.initServices();
    sut = await container.find('sut');
  });

  describe('correct initialization', () => {
    it('has the correct state', () => {
      expect(sut.solutionEventBusName).toBe(settings.solutionEventBusName);
    });
  });

  describe('create rule', () => {
    describe('successful calls', () => {
      // Setup
      const inputObject = { id: 'correctId', eventPattern: 'correctPattern' };
      const apiReturnValue = { RuleArn: 'correctArn' };

      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        auditWriterServiceMock.writeAndForget.mockImplementationOnce(() => {});
        eventBridgeClientMock.putRule.mockImplementationOnce(() => {
          return { promise: () => Promise.resolve(apiReturnValue) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus
        ${undefined}   | ${settings.solutionEventBusName}
        ${'customBus'} | ${'customBus'}
      `(
        'correctly calls the API to create a new rule on the $eventBusParam bus',
        async ({ eventBusParam, expectedEventBus }) => {
          // Action
          const actual = await sut.createRule({}, inputObject, eventBusParam);

          // Validation
          expect(actual.id).toBe(inputObject.id);
          expect(actual.arn).toBe(apiReturnValue.RuleArn);

          expect(eventBridgeClientMock.putRule).toHaveBeenCalledWith({
            Name: inputObject.id,
            EventBusName: expectedEventBus,
            EventPattern: inputObject.eventPattern,
            State: 'ENABLED',
          });
        },
      );

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'create-rule' },
        );

        expect(auditWriterServiceMock.writeAndForget).toHaveBeenCalledWith(
          {} /* requestContext */,
          { action: 'create-rule', body: expect.any(Object) },
        );
      });
    });

    describe('auth failures', () => {
      const exceptionMessage = 'Auth Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {
          throw new Error(exceptionMessage);
        });
      });

      it('does not block authentication failure exceptions', async () => {
        // Action
        try {
          await sut.createRule({}, {});
        } catch (e) {
          expect(e.message).toBe(exceptionMessage);
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'create-rule' },
        );
      });
    });

    describe('validation failures', () => {
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
      });

      it.each`
        description                 | id                     | pattern
        ${'no params'}              | ${undefined}           | ${undefined}
        ${'missing pattern'}        | ${'someId'}            | ${undefined}
        ${'missing id'}             | ${undefined}           | ${'pattern'}
        ${'empty id'}               | ${''}                  | ${'pattern'}
        ${'empty pattern'}          | ${'someId'}            | ${''}
        ${'invalid type id'}        | ${1}                   | ${'pattern'}
        ${'invalid type pattern'}   | ${'someId'}            | ${1}
        ${'exceeds length id'}      | ${Array(66).join('i')} | ${'pattern'}
        ${'exceeds length pattern'} | ${'someId'}            | ${Array(2050).join('i')}
      `('fails validation with $description', async ({ id, pattern }) => {
        // Action
        try {
          await sut.createRule({}, { id, pattern });
        } catch (e) {
          expect(e.status).toBe(400);
          expect(e.code).toBe('badRequest');
          expect(e.message).toBe('Input has validation errors');
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'create-rule' },
        );
      });
    });

    describe('api failures', () => {
      const inputObject = { id: 'correctId', eventPattern: 'correctPattern' };
      const exceptionMessage = 'API Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        eventBridgeClientMock.putRule.mockImplementationOnce(() => {
          return { promise: () => Promise.reject(new Error(exceptionMessage)) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus
        ${undefined}   | ${settings.solutionEventBusName}
        ${'customBus'} | ${'customBus'}
      `('transforms and logs api failures for bus $eventBusParam', async ({ eventBusParam, expectedEventBus }) => {
        // Action
        try {
          await sut.createRule({}, inputObject, eventBusParam);
        } catch (e) {
          expect(e.status).toBe(500);
          expect(e.code).toBe('internalError');
          expect(e.message).toBe(
            `Failed to create rule for bus ${expectedEventBus} and rule ${inputObject.id}: ${exceptionMessage}`,
          );
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'create-rule' },
        );
      });
    });
  });

  describe('delete rule', () => {
    describe('successful calls', () => {
      // Setup
      const inputObject = { id: 'correctId' };
      const apiReturnValue = {};

      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        auditWriterServiceMock.writeAndForget.mockImplementationOnce(() => {});
        eventBridgeClientMock.deleteRule.mockImplementationOnce(() => {
          return { promise: () => Promise.resolve(apiReturnValue) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus
        ${undefined}   | ${settings.solutionEventBusName}
        ${'customBus'} | ${'customBus'}
      `(
        'correctly calls the API to delete a rule on the $eventBusParam bus',
        async ({ eventBusParam, expectedEventBus }) => {
          // Action
          const actual = await sut.deleteRule({}, inputObject, eventBusParam);

          // Validation
          expect(actual.id).toBe(inputObject.id);
          expect(actual.arn).toBe(apiReturnValue.RuleArn);

          expect(eventBridgeClientMock.deleteRule).toHaveBeenCalledWith({
            Name: inputObject.id,
            EventBusName: expectedEventBus,
          });
        },
      );

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'delete-rule' },
        );

        expect(auditWriterServiceMock.writeAndForget).toHaveBeenCalledWith(
          {} /* requestContext */,
          { action: 'delete-rule', body: expect.any(Object) },
        );
      });
    });

    describe('auth failures', () => {
      const exceptionMessage = 'Auth Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {
          throw new Error(exceptionMessage);
        });
      });

      it('does not block authentication failure exceptions', async () => {
        // Action
        try {
          await sut.deleteRule({}, {});
        } catch (e) {
          expect(e.message).toBe(exceptionMessage);
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'delete-rule' },
        );
      });
    });

    describe('validation failures', () => {
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
      });

      it.each`
        description            | id
        ${'no params'}         | ${undefined}
        ${'empty id'}          | ${''}
        ${'invalid type id'}   | ${1}
        ${'exceeds length id'} | ${Array(66).join('i')}
      `('fails validation with $description', async ({ id }) => {
        // Action
        try {
          await sut.deleteRule({}, { id });
        } catch (e) {
          expect(e.status).toBe(400);
          expect(e.code).toBe('badRequest');
          expect(e.message).toBe('Input has validation errors');
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'delete-rule' },
        );
      });
    });

    describe('api failures', () => {
      const inputObject = { id: 'correctId' };
      const exceptionMessage = 'API Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        eventBridgeClientMock.deleteRule.mockImplementationOnce(() => {
          return { promise: () => Promise.reject(new Error(exceptionMessage)) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus
        ${undefined}   | ${settings.solutionEventBusName}
        ${'customBus'} | ${'customBus'}
      `('transforms and logs api failures for bus $eventBusParam', async ({ eventBusParam, expectedEventBus }) => {
        // Action
        try {
          await sut.deleteRule({}, inputObject, eventBusParam);
        } catch (e) {
          expect(e.status).toBe(500);
          expect(e.code).toBe('internalError');
          expect(e.message).toBe(
            `Failed to delete rule for bus ${expectedEventBus} and rule ${inputObject.id}: ${exceptionMessage}`,
          );
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'delete-rule' },
        );
      });
    });
  });

  describe('create rule target', () => {
    describe('successful calls', () => {
      // Setup
      const inputObject = { id: 'correctId', targetArn: 'correctTargetArn' };
      const apiReturnValue = {};
      const inputTransformerPathMap = { input: '$' };
      const inputTransformerTemplate = '{ "input": <input>, "meta": { "field1": "val1" } }';

      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        auditWriterServiceMock.writeAndForget.mockImplementationOnce(() => {});
        eventBridgeClientMock.putTargets.mockImplementationOnce(() => {
          return { promise: () => Promise.resolve(apiReturnValue) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus                 | pathsMap                   | template
        ${undefined}   | ${settings.solutionEventBusName} | ${undefined}               | ${undefined}
        ${'customBus'} | ${'customBus'}                   | ${undefined}               | ${undefined}
        ${undefined}   | ${settings.solutionEventBusName} | ${inputTransformerPathMap} | ${inputTransformerTemplate}
        ${'customBus'} | ${'customBus'}                   | ${inputTransformerPathMap} | ${inputTransformerTemplate}
      `(
        'correctly calls the API to create a target for rule on the $eventBusParam bus with input transformer $pathsMap',
        async ({ eventBusParam, expectedEventBus, pathsMap, template }) => {
          // Setup
          if (!_.isEmpty(pathsMap) || !_.isEmpty(template)) {
            inputObject.inputTransformer = { pathsMap: JSON.stringify(pathsMap), template };
          } else {
            inputObject.inputTransformer = undefined;
          }

          // Action
          const actual = await sut.createRuleTarget({}, inputObject, eventBusParam);

          // Validation
          expect(actual.id).toMatch(/eb-.*/);
          expect(actual.ruleId).toBe(inputObject.id);

          expect(eventBridgeClientMock.putTargets).toHaveBeenCalled();

          const firstCall = _.first(eventBridgeClientMock.putTargets.mock.calls);
          const firstArgument = _.first(firstCall);
          expect(firstArgument).toMatchObject({
            Rule: inputObject.id,
            EventBusName: expectedEventBus,
            Targets: [
              {
                Arn: inputObject.targetArn,
                Id: actual.id,
                InputTransformer: {
                  InputTemplate: template,
                  InputPathsMap: pathsMap,
                },
              },
            ],
          });
        },
      );

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'create-rule-target' },
        );

        expect(auditWriterServiceMock.writeAndForget).toHaveBeenCalledWith(
          {} /* requestContext */,
          { action: 'create-rule-target', body: expect.any(Object) },
        );
      });
    });

    describe('auth failures', () => {
      const exceptionMessage = 'Auth Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {
          throw new Error(exceptionMessage);
        });
      });

      it('does not block authentication failure exceptions', async () => {
        // Action
        try {
          await sut.createRuleTarget({}, {});
        } catch (e) {
          expect(e.message).toBe(exceptionMessage);
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'create-rule-target' },
        );
      });
    });

    describe('validation failures', () => {
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
      });

      it.each`
        description                   | id                     | targetArn                | pathsMap      | template
        ${'no params'}                | ${undefined}           | ${undefined}             | ${undefined}  | ${undefined}
        ${'missing targetArn'}        | ${'someId'}            | ${undefined}             | ${undefined}  | ${undefined}
        ${'missing id'}               | ${undefined}           | ${'arn'}                 | ${undefined}  | ${undefined}
        ${'invalid type id'}          | ${1}                   | ${'arn'}                 | ${undefined}  | ${undefined}
        ${'invalid type targetArn'}   | ${'someId'}            | ${1}                     | ${undefined}  | ${undefined}
        ${'invalid type pathsMap'}    | ${'someId'}            | ${'arn'}                 | ${1}          | ${'template'}
        ${'invalid type template'}    | ${'someId'}            | ${'arn'}                 | ${'pathsMap'} | ${1}
        ${'exceeds length id'}        | ${Array(66).join('i')} | ${'arn'}                 | ${'pathsMap'} | ${'template'}
        ${'exceeds length targetArn'} | ${'someId'}            | ${Array(2050).join('i')} | ${'pathsMap'} | ${'template'}
      `('fails validation with $description', async ({ id, targetArn, pathsMap, template }) => {
        // Action
        try {
          await sut.createRuleTarget({}, { id, targetArn, inputTransformer: { pathsMap, template } });
        } catch (e) {
          expect(e.status).toBe(400);
          expect(e.code).toBe('badRequest');
          expect(e.message).toBe('Input has validation errors');
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'create-rule-target' },
        );
      });
    });

    describe('api failures', () => {
      const inputObject = { id: 'correctId', targetArn: 'correctTargetArn' };
      const exceptionMessage = 'API Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        eventBridgeClientMock.putTargets.mockImplementationOnce(() => {
          return { promise: () => Promise.reject(new Error(exceptionMessage)) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus
        ${undefined}   | ${settings.solutionEventBusName}
        ${'customBus'} | ${'customBus'}
      `('transforms and logs api failures for bus $eventBusParam', async ({ eventBusParam, expectedEventBus }) => {
        // Action
        try {
          await sut.createRuleTarget({}, inputObject, eventBusParam);
        } catch (e) {
          expect(e.status).toBe(500);
          expect(e.code).toBe('internalError');
          expect(e.message).toBe(
            `Failed to create rule target for bus ${expectedEventBus} and rule ${inputObject.id}: ${exceptionMessage}`,
          );
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'create-rule-target' },
        );
      });
    });
  });

  describe('delete rule target', () => {
    describe('successful calls', () => {
      // Setup
      const inputObject = { id: 'correctTargetId', ruleId: 'correctRuleId' };
      const apiReturnValue = {};

      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        auditWriterServiceMock.writeAndForget.mockImplementationOnce(() => {});
        eventBridgeClientMock.removeTargets.mockImplementationOnce(() => {
          return { promise: () => Promise.resolve(apiReturnValue) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus
        ${undefined}   | ${settings.solutionEventBusName}
        ${'customBus'} | ${'customBus'}
      `(
        'correctly calls the API to delete a rule on the $eventBusParam bus',
        async ({ eventBusParam, expectedEventBus }) => {
          // Action
          const actual = await sut.deleteRuleTarget({}, inputObject, eventBusParam);

          // Validation
          expect(actual.id).toBe(inputObject.id);
          expect(actual.arn).toBe(apiReturnValue.RuleArn);

          expect(eventBridgeClientMock.removeTargets).toHaveBeenCalledWith({
            Ids: [inputObject.id],
            Rule: inputObject.ruleId,
            EventBusName: expectedEventBus,
          });
        },
      );

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'delete-rule-target' },
        );

        expect(auditWriterServiceMock.writeAndForget).toHaveBeenCalledWith(
          {} /* requestContext */,
          { action: 'delete-rule-target', body: expect.any(Object) },
        );
      });
    });

    describe('auth failures', () => {
      const exceptionMessage = 'Auth Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {
          throw new Error(exceptionMessage);
        });
      });

      it('does not block authentication failure exceptions', async () => {
        // Action
        try {
          await sut.deleteRuleTarget({}, {});
        } catch (e) {
          expect(e.message).toBe(exceptionMessage);
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'delete-rule-target' },
        );
      });
    });

    describe('validation failures', () => {
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
      });

      it.each`
        description                | id                       | ruleId
        ${'no params'}             | ${undefined}             | ${undefined}
        ${'missing ruleId'}        | ${'someId'}              | ${undefined}
        ${'missing id'}            | ${undefined}             | ${'ruleId'}
        ${'empty id'}              | ${''}                    | ${'ruleId'}
        ${'empty ruleId'}          | ${'someId'}              | ${''}
        ${'invalid type id'}       | ${1}                     | ${'ruleId'}
        ${'invalid type ruleId'}   | ${'someId'}              | ${1}
        ${'exceeds length id'}     | ${Array(1026).join('i')} | ${'ruleId'}
        ${'exceeds length ruleId'} | ${'someId'}              | ${Array(66).join('i')}
      `('fails validation with $description', async ({ id, ruleId }) => {
        // Action
        try {
          await sut.deleteRuleTarget({}, { id, ruleId });
        } catch (e) {
          expect(e.status).toBe(400);
          expect(e.code).toBe('badRequest');
          expect(e.message).toBe('Input has validation errors');
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'delete-rule-target' },
        );
      });
    });

    describe('api failures', () => {
      const inputObject = { id: 'correctTargetId', ruleId: 'correctRuleId' };
      const exceptionMessage = 'API Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        eventBridgeClientMock.removeTargets.mockImplementationOnce(() => {
          return { promise: () => Promise.reject(new Error(exceptionMessage)) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus
        ${undefined}   | ${settings.solutionEventBusName}
        ${'customBus'} | ${'customBus'}
      `('transforms and logs api failures for bus $eventBusParam', async ({ eventBusParam, expectedEventBus }) => {
        // Action
        try {
          await sut.deleteRuleTarget({}, inputObject, eventBusParam);
        } catch (e) {
          expect(e.status).toBe(500);
          expect(e.code).toBe('internalError');
          expect(e.message).toBe(
            `Failed to delete rule target for bus ${expectedEventBus}, rule ${inputObject.ruleId} and rule target ${inputObject.id}: ${exceptionMessage}`,
          );
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'delete-rule-target' },
        );
      });
    });
  });

  describe('publish event', () => {
    describe('successful calls', () => {
      // Setup
      const inputObject = {
        detailType: 'correctDetailType',
        detail: { field1: 'value1' },
        sourceSystem: 'correctSourceSystem',
      };
      const apiReturnValue = { Entries: [{ EventId: 'event-1' }] };

      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        auditWriterServiceMock.writeAndForget.mockImplementationOnce(() => {});
        eventBridgeClientMock.putEvents.mockImplementationOnce(() => {
          return { promise: () => Promise.resolve(apiReturnValue) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus                 | eventTime
        ${undefined}   | ${settings.solutionEventBusName} | ${undefined}
        ${'customBus'} | ${'customBus'}                   | ${undefined}
        ${undefined}   | ${settings.solutionEventBusName} | ${new Date().toISOString()}
        ${'customBus'} | ${'customBus'}                   | ${new Date().toISOString()}
      `(
        'correctly calls the API to publish a new event on the $eventBusParam bus with time $eventTime',
        async ({ eventBusParam, expectedEventBus, eventTime }) => {
          // Setup
          if (!_.isEmpty(eventTime)) {
            inputObject.createdAt = eventTime;
          } else {
            inputObject.createdAt = undefined;
          }

          // Action
          const actual = await sut.publishEvent({}, inputObject, eventBusParam);

          // Validation
          expect(actual.length).toBe(1);
          expect(_.first(actual)).toBe('event-1');

          expect(eventBridgeClientMock.putEvents).toHaveBeenCalled();

          const firstCall = _.first(eventBridgeClientMock.putEvents.mock.calls);
          const firstArgument = _.first(firstCall);

          expect(firstArgument).toMatchObject({
            Entries: [
              {
                Detail: JSON.stringify(inputObject.detail),
                DetailType: inputObject.detailType,
                EventBusName: expectedEventBus,
                Source: inputObject.sourceSystem,
                Time: eventTime,
              },
            ],
          });
        },
      );

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'publish' },
        );

        expect(auditWriterServiceMock.writeAndForget).toHaveBeenCalledWith(
          {} /* requestContext */,
          { action: 'publish-event', body: expect.any(Object) },
        );
      });
    });

    describe('auth failures', () => {
      const exceptionMessage = 'Auth Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {
          throw new Error(exceptionMessage);
        });
      });

      it('does not block authentication failure exceptions', async () => {
        // Action
        try {
          await sut.publishEvent({}, {});
        } catch (e) {
          expect(e.message).toBe(exceptionMessage);
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'publish' },
        );
      });
    });

    describe('validation failures', () => {
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
      });

      it.each`
        description                      | detailType               | detail       | sourceSystem             | createdAt
        ${'no params'}                   | ${undefined}             | ${undefined} | ${undefined}             | ${undefined}
        ${'missing detailType'}          | ${undefined}             | ${{}}        | ${'someSystem'}          | ${undefined}
        ${'missing detail'}              | ${'someDetailType'}      | ${undefined} | ${'someSystem'}          | ${undefined}
        ${'missing sourceSystem'}        | ${'someDetailType'}      | ${{}}        | ${undefined}             | ${undefined}
        ${'invalid type detailType'}     | ${1}                     | ${{}}        | ${'someSystem'}          | ${undefined}
        ${'invalid type detail'}         | ${'someDetailType'}      | ${1}         | ${'someSystem'}          | ${undefined}
        ${'invalid type sourceSystem'}   | ${'someDetailType'}      | ${{}}        | ${1}                     | ${undefined}
        ${'invalid type createdAt'}      | ${'someDetailType'}      | ${{}}        | ${'someSystem'}          | ${1}
        ${'exceeds length detailType'}   | ${Array(1026).join('i')} | ${{}}        | ${'someSystem'}          | ${undefined}
        ${'exceeds length sourceSystem'} | ${'someDetailType'}      | ${{}}        | ${Array(1026).join('i')} | ${undefined}
        ${'exceeds length createdAt'}    | ${'someDetailType'}      | ${{}}        | ${'someSystem'}          | ${Array(1026).join('i')}
      `('fails validation with $description', async ({ detailType, detail, sourceSystem, createdAt }) => {
        // Action
        try {
          await sut.publishEvent({}, { detailType, detail, sourceSystem, createdAt });
        } catch (e) {
          expect(e.status).toBe(400);
          expect(e.code).toBe('badRequest');
          expect(e.message).toBe('Input has validation errors');
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'publish' },
        );
      });
    });

    describe('api failures', () => {
      const inputObject = {
        detailType: 'correctDetailType',
        detail: { field1: 'value1' },
        sourceSystem: 'correctSourceSystem',
      };
      const exceptionMessage = 'API Failure';
      beforeEach(() => {
        authorizationServiceMock.assertAuthorized.mockImplementationOnce(() => {});
        eventBridgeClientMock.putEvents.mockImplementationOnce(() => {
          return { promise: () => Promise.reject(new Error(exceptionMessage)) };
        });
      });

      it.each`
        eventBusParam  | expectedEventBus
        ${undefined}   | ${settings.solutionEventBusName}
        ${'customBus'} | ${'customBus'}
      `('transforms and logs api failures for bus $eventBusParam', async ({ eventBusParam, expectedEventBus }) => {
        // Action
        try {
          await sut.publishEvent({}, inputObject, eventBusParam);
        } catch (e) {
          expect(e.status).toBe(500);
          expect(e.code).toBe('internalError');
          expect(e.message).toBe(`Failed to put events on bus ${expectedEventBus}: ${exceptionMessage}`);
        }
      });

      afterEach(() => {
        // Validation
        expect(authorizationServiceMock.assertAuthorized).toHaveBeenCalledWith(
          {} /* requestContext */,
          { extensionPoint: authzExtensionPoint, conditions: expect.any(Array), action: 'publish' },
        );
      });
    });
  });
});
