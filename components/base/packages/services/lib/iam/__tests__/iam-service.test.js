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

import { ServicesContainer } from '@aws-ee/base-services-container';
import IamService from '../iam-service';

class MockIAM {}

function asApiResult(value) {
  return {
    promise: () => Promise.resolve(value),
  };
}

describe('IamService', () => {
  let sut;

  beforeEach(async () => {
    const container = new ServicesContainer();
    const mockAwsService = {
      initService: jest.fn().mockResolvedValue(),
      sdk: { IAM: MockIAM },
    };
    container.register('aws', mockAwsService);
    container.register('sut', new IamService());
    await container.initServices();
    sut = await container.find('sut');
  });

  it('instantiates a client', () => {
    expect(sut.api).toBeTruthy();
  });

  describe('.listAllInlineRolePolicies', () => {
    it('lists all inline role policies', async () => {
      sut.api.listRolePolicies = jest
        .fn()
        .mockReturnValueOnce(
          asApiResult({
            PolicyNames: ['PolicyA', 'PolicyB'],
            IsTruncated: true,
            Marker: 'Page2',
          }),
        )
        .mockReturnValue(
          asApiResult({
            PolicyNames: ['PolicyC'],
          }),
        );

      const result = await sut.listAllInlineRolePolicies('testPolicy');
      expect(result).toEqual(['PolicyA', 'PolicyB', 'PolicyC']);
    });
  });

  describe('.listAllManagedRolePolicies', () => {
    it('lists all managed role policies', async () => {
      sut.api.listAttachedRolePolicies = jest
        .fn()
        .mockReturnValueOnce(
          asApiResult({
            AttachedPolicies: ['PolicyA', 'PolicyB'],
            IsTruncated: true,
            Marker: 'Page2',
          }),
        )
        .mockReturnValue(
          asApiResult({
            AttachedPolicies: ['PolicyC'],
          }),
        );

      const result = await sut.listAllManagedRolePolicies('testPolicy');
      expect(result).toEqual(['PolicyA', 'PolicyB', 'PolicyC']);
    });
  });

  describe('.listAllPolicyVersions', () => {
    it('lists all policy versions', async () => {
      sut.api.listPolicyVersions = jest
        .fn()
        .mockReturnValueOnce(
          asApiResult({
            Versions: ['PolicyA', 'PolicyB'],
            IsTruncated: true,
            Marker: 'Page2',
          }),
        )
        .mockReturnValue(
          asApiResult({
            Versions: ['PolicyC'],
          }),
        );

      const result = await sut.listAllPolicyVersions('testPolicy');
      expect(result).toEqual(['PolicyA', 'PolicyB', 'PolicyC']);
    });
  });

  describe('.deletePolicy', () => {
    it('deletes a policy', async () => {
      sut.api.listPolicyVersions = jest.fn().mockReturnValue(
        asApiResult({
          Versions: [
            { VersionId: 'VersionA', IsDefaultVersion: false },
            { VersionId: 'VersionB', IsDefaultVersion: false },
            { VersionId: 'VersionC', IsDefaultVersion: true },
          ],
        }),
      );
      sut.api.deletePolicyVersion = jest.fn().mockReturnValue({ promise: () => Promise.resolve() });
      sut.api.deletePolicy = jest.fn().mockReturnValue({ promise: () => Promise.resolve() });

      await sut.deletePolicy('testPolicyArn');
      expect(sut.api.deletePolicyVersion).toHaveBeenCalledWith({ PolicyArn: 'testPolicyArn', VersionId: 'VersionA' });
      expect(sut.api.deletePolicyVersion).toHaveBeenCalledWith({ PolicyArn: 'testPolicyArn', VersionId: 'VersionB' });
      expect(sut.api.deletePolicyVersion).not.toHaveBeenCalledWith({
        PolicyArn: 'testPolicyArn',
        VersionId: 'VersionC',
      });
      expect(sut.api.deletePolicy).toHaveBeenCalledWith({ PolicyArn: 'testPolicyArn' });
    });
  });

  describe('.createPolicyVersion', () => {
    it('creates a policy', async () => {
      sut.api.listPolicyVersions = jest.fn().mockReturnValue(
        asApiResult({
          Versions: [
            { VersionId: 'VersionA', IsDefaultVersion: false },
            { VersionId: 'VersionB', IsDefaultVersion: false },
            { VersionId: 'VersionC', IsDefaultVersion: false },
            { VersionId: 'VersionD', IsDefaultVersion: false },
            { VersionId: 'VersionE', IsDefaultVersion: false },
          ],
        }),
      );
      sut.api.deletePolicyVersion = jest.fn().mockReturnValue({ promise: () => Promise.resolve() });
      sut.api.createPolicyVersion = jest.fn().mockReturnValue({ promise: () => Promise.resolve() });

      await sut.createPolicyVersion('testPolicyArn', 'policyDoc', true);
      expect(sut.api.deletePolicyVersion).toHaveBeenCalledTimes(1);
      expect(sut.api.deletePolicyVersion).toHaveBeenCalledWith({ PolicyArn: 'testPolicyArn', VersionId: 'VersionA' });
      expect(sut.api.createPolicyVersion).toHaveBeenCalledWith({
        PolicyArn: 'testPolicyArn',
        PolicyDocument: 'policyDoc',
        SetAsDefault: true,
      });
    });
  });

  describe('.getRoleInfo', () => {
    it('gets role info', async () => {
      sut.api.getRole = jest.fn().mockReturnValue(
        asApiResult({
          Role: {
            AssumeRolePolicyDocument: '{"trust":"policy"}',
          },
        }),
      );

      const result = await sut.getRoleInfo('testRole');
      expect(result).toEqual({
        Role: {
          AssumeRolePolicyDocument: '{"trust":"policy"}',
          AssumeRolePolicyDocumentObj: {
            trust: 'policy',
          },
        },
      });
    });
  });

  describe('.getRolePolicy', () => {
    it('gets role policy', async () => {
      sut.api.getRolePolicy = jest.fn().mockReturnValue(
        asApiResult({
          PolicyDocument: '{"trust":"policy"}',
        }),
      );

      const result = await sut.getRolePolicy('testRole', 'testPolicy');
      expect(result).toEqual({
        PolicyDocument: '{"trust":"policy"}',
        PolicyDocumentObj: {
          trust: 'policy',
        },
      });
    });
  });

  describe('.getPolicyVersion', () => {
    it('gets role policy version', async () => {
      sut.api.getPolicyVersion = jest.fn().mockReturnValue(
        asApiResult({
          PolicyVersion: {
            Document: '{"trust":"policy"}',
          },
        }),
      );

      const result = await sut.getPolicyVersion('testRole', 'testPolicy');
      expect(result).toEqual({
        PolicyVersion: {
          Document: '{"trust":"policy"}',
          DocumentObj: {
            trust: 'policy',
          },
        },
      });
    });
  });
});
