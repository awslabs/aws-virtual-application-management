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

/* eslint-disable prefer-promise-reject-errors */
import _ from 'lodash';
import { itProp, fc } from 'jest-fast-check';
import { ServicesContainer } from '@aws-ee/base-services-container';
import moveS3ObjectSchema from '../schema/move-s3-object.json';
import S3Service from '../s3-service';

class MockS3Client {}

describe('S3Service', () => {
  let sut;
  let validationService;

  beforeEach(async () => {
    const container = new ServicesContainer();
    const mockAwsService = {
      initService: jest.fn().mockResolvedValue(),
      sdk: { S3: MockS3Client },
    };
    validationService = {
      initService: jest.fn().mockResolvedValue(),
    };
    container.register('aws', mockAwsService);
    container.register('sut', new S3Service());
    container.register('jsonSchemaValidationService', validationService);
    await container.initServices();
    sut = await container.find('sut');
  });

  describe('.sign', () => {
    describe('with successful API call', () => {
      beforeEach(() => {
        sut.api.getSignedUrl = jest.fn((_method, params, callback) => {
          callback(undefined, `signedUrl[${params.Bucket}/${params.Key}]`);
        });
      });

      it('returns an empty array when no input is given', async () => {
        expect(await sut.sign()).toEqual([]);
      });

      it('calls the API function with the correct params', async () => {
        await sut.sign({ files: [{ bucket: 'testBucket', key: 'testKey' }] });

        expect(sut.api.getSignedUrl).toHaveBeenCalledWith(
          'getObject',
          {
            Bucket: 'testBucket',
            Expires: 120,
            Key: 'testKey',
          },
          expect.any(Function),
        );
      });

      it('returns signed URLs', async () => {
        const result = await sut.sign({ files: [{ bucket: 'testBucket', key: 'testKey' }] });

        expect(result).toEqual([{ bucket: 'testBucket', key: 'testKey', signedUrl: 'signedUrl[testBucket/testKey]' }]);
      });
    });

    describe('with failing API call', () => {
      beforeEach(() => {
        sut.api.getSignedUrl = jest.fn((_method, _params, callback) => {
          callback('mockError');
        });
      });

      it('returns an empty array when no input is given (API is not called)', async () => {
        expect(await sut.sign()).toEqual([]);
      });

      it('bubbles the error', async () => {
        try {
          await sut.sign({ files: [{ bucket: 'testBucket', key: 'testKey' }] });
        } catch (err) {
          expect(err).toBe('mockError');
          return;
        }
        throw new Error('expected exception');
      });
    });
  });

  describe('.listObjects', () => {
    const expectedResponse1 = {
      Contents: [
        { Key: 'testPrefix/' },
        { Key: 'testPrefix/testFile1', LastModified: 'LM1', ETag: 'ET1', Size: 1001, StorageClass: 'SC1' },
        { Key: 'testPrefix/subFolder1/' },
      ],
      NextContinuationToken: 'butWaitThereIsMore',
    };
    const expectedResponse2 = {
      Contents: [
        { Key: 'testPrefix/testFile2', LastModified: 'LM2', ETag: 'ET2', Size: 1002, StorageClass: 'SC2' },
        { Key: 'testPrefix/subFolder1/testFile3', LastModified: 'LM3', ETag: 'ET3', Size: 1003, StorageClass: 'SC3' },
      ],
    };
    describe.each`
      prefix
      ${'testPrefix'}
      ${'testPrefix/'}
    `('with successful API call ($prefix)', ({ prefix }) => {
      beforeEach(() => {
        sut.api.listObjectsV2 = jest
          .fn()
          .mockReturnValueOnce({ promise: () => Promise.resolve(expectedResponse1) })
          .mockReturnValue({ promise: () => Promise.resolve(expectedResponse2) });
      });

      it('calls the API with the correct params', async () => {
        await sut.listObjects({ bucket: 'testBucket', prefix });

        expect(sut.api.listObjectsV2).toHaveBeenCalledTimes(2);
        expect(sut.api.listObjectsV2).toHaveBeenCalledWith({
          Bucket: 'testBucket',
          ContinuationToken: 'butWaitThereIsMore',
          MaxKeys: 980,
          Prefix: prefix,
        });
        expect(sut.api.listObjectsV2).toHaveBeenCalledWith({
          Bucket: 'testBucket',
          ContinuationToken: undefined,
          MaxKeys: 980,
          Prefix: prefix,
        });
      });

      it('returns the expected result', async () => {
        const result = await sut.listObjects({ bucket: 'testBucket', prefix });
        expect(result).toEqual([
          {
            bucket: 'testBucket',
            etag: 'ET1',
            filename: 'testFile1',
            fullPath: 'testFile1',
            isFolder: false,
            key: 'testPrefix/testFile1',
            size: 1001,
            storageClass: 'SC1',
            updatedAt: 'LM1',
          },
          {
            bucket: 'testBucket',
            etag: undefined,
            filename: 'subFolder1',
            fullPath: 'subFolder1/',
            isFolder: true,
            key: 'testPrefix/subFolder1/',
            size: undefined,
            storageClass: undefined,
            updatedAt: undefined,
          },
          {
            bucket: 'testBucket',
            etag: 'ET2',
            filename: 'testFile2',
            fullPath: 'testFile2',
            isFolder: false,
            key: 'testPrefix/testFile2',
            size: 1002,
            storageClass: 'SC2',
            updatedAt: 'LM2',
          },
          {
            bucket: 'testBucket',
            etag: 'ET3',
            filename: 'testFile3',
            fullPath: 'subFolder1/testFile3',
            isFolder: false,
            key: 'testPrefix/subFolder1/testFile3',
            size: 1003,
            storageClass: 'SC3',
            updatedAt: 'LM3',
          },
        ]);
      });
    });

    describe('with failing API call', () => {
      beforeEach(() => {
        sut.api.listObjectsV2 = jest.fn().mockReturnValue({ promise: () => Promise.reject(new Error('mockError')) });
      });

      it('bubbles the exception', async () => {
        try {
          await sut.listObjects({ bucket: 'testBucket', prefix: 'testPrefix' });
        } catch (err) {
          expect(err).toEqual(new Error('mockError'));
          return;
        }
        throw new Error('expected exception');
      });
    });
  });

  describe('.parseS3Details', () => {
    itProp('throws on an incorrect URL', fc.string(), url => {
      fc.pre(!_.startsWith(url, 's3://'));
      expect(() => sut.parseS3Details(url)).toThrow(
        'Incorrect s3Location. Expecting s3Location to be in s3://bucketname/s3key format',
      );
    });

    it.each`
      url                                     | result
      ${'s3://'}                              | ${{ s3BucketName: '', s3Key: '' }}
      ${'s3://testBucket'}                    | ${{ s3BucketName: 'testBucket', s3Key: '' }}
      ${'s3://testBucket/testKey'}            | ${{ s3BucketName: 'testBucket', s3Key: 'testKey' }}
      ${'s3:///testKey'}                      | ${{ s3BucketName: '', s3Key: 'testKey' }}
      ${'s3://testBucket/testPrefix/testKey'} | ${{ s3BucketName: 'testBucket', s3Key: 'testPrefix/testKey' }}
    `('returns the expected result ($url)', ({ url, result }) => {
      expect(sut.parseS3Details(url)).toEqual(result);
    });
  });
  describe('.doesS3LocationExist', () => {
    describe('when it exists', () => {
      beforeEach(() => {
        sut.api.listObjectsV2 = jest.fn().mockReturnValue({ promise: () => Promise.resolve({ KeyCount: 1 }) });
        sut.api.headBucket = jest.fn().mockReturnValue({ promise: () => Promise.resolve({ anything: 'is fine' }) });
      });

      it('returns true for fully qualified URIs', async () => {
        expect(await sut.doesS3LocationExist('s3://testBucket/testKey')).toBe(true);
      });

      it('returns true for buckets', async () => {
        expect(await sut.doesS3LocationExist('s3://testBucket')).toBe(true);
      });

      it('returns true for buckets (trailing slash version)', async () => {
        expect(await sut.doesS3LocationExist('s3://testBucket/')).toBe(true);
      });

      it('calls listObjectsV2 for fully qualified URIs', async () => {
        await sut.doesS3LocationExist('s3://testBucket/testKey');
        expect(sut.api.listObjectsV2).toHaveBeenCalledWith({ Bucket: 'testBucket', Prefix: 'testKey' });
        expect(sut.api.headBucket).not.toHaveBeenCalled();
      });

      it('calls headBucket for bucket URIs', async () => {
        await sut.doesS3LocationExist('s3://testBucket');
        expect(sut.api.listObjectsV2).not.toHaveBeenCalled();
        expect(sut.api.headBucket).toHaveBeenCalledWith({ Bucket: 'testBucket' });
      });
    });

    describe.each`
      errorCode
      ${'NotFound'}
      ${'NoSuchBucket'}
      ${'NoSuchKey'}
    `('when it is not found ($errorCode)', ({ errorCode }) => {
      beforeEach(() => {
        sut.api.listObjectsV2 = jest.fn().mockReturnValue({ promise: () => Promise.reject({ code: errorCode }) });
        sut.api.headBucket = jest.fn().mockReturnValue({ promise: () => Promise.reject({ code: errorCode }) });
      });

      it('returns false for fully qualified URIs', async () => {
        expect(await sut.doesS3LocationExist('s3://testBucket/testKey')).toBe(false);
      });

      it('returns false for buckets', async () => {
        expect(await sut.doesS3LocationExist('s3://testBucket')).toBe(false);
      });

      it('returns false for buckets (trailing slash version)', async () => {
        expect(await sut.doesS3LocationExist('s3://testBucket/')).toBe(false);
      });
    });

    describe('when any other error occurs', () => {
      const mockError = new Error('Out of eels');
      beforeEach(() => {
        sut.api.listObjectsV2 = jest.fn().mockReturnValue({ promise: () => Promise.reject(mockError) });
        sut.api.headBucket = jest.fn().mockReturnValue({ promise: () => Promise.reject(mockError) });
      });

      it('bubbles for fully qualified URIs', async () => {
        try {
          await sut.doesS3LocationExist('s3://testBucket/testKey');
        } catch (err) {
          expect(err).toEqual(mockError);
          return;
        }
        throw new Error('Expected an exception');
      });

      it('bubbles for bucket URIs', async () => {
        try {
          await sut.doesS3LocationExist('s3://testBucket');
        } catch (err) {
          expect(err).toEqual(mockError);
          return;
        }
        throw new Error('Expected an exception');
      });
    });
  });

  describe('.moveObject', () => {
    describe('raw data is valid and API calls succeed', () => {
      beforeEach(() => {
        validationService.ensureValid = jest.fn().mockResolvedValue();
        sut.api.copyObject = jest.fn().mockReturnValue({ promise: () => Promise.resolve() });
        sut.api.deleteObject = jest.fn().mockReturnValue({ promise: () => Promise.resolve() });
      });

      it('calls the validation service', async () => {
        await sut.moveObject({ from: {}, to: {} });
        expect(validationService.ensureValid).toHaveBeenCalledWith({ from: {}, to: {} }, moveS3ObjectSchema);
      });

      it('calls the APIs as expected', async () => {
        await sut.moveObject({
          from: { bucket: 'fromBucket', key: 'fromKey' },
          to: { bucket: 'toBucket', key: 'toKey' },
        });

        expect(sut.api.copyObject).toHaveBeenCalledWith({
          Bucket: 'toBucket',
          CopySource: '/fromBucket/fromKey',
          Key: 'toKey',
        });
        expect(sut.api.deleteObject).toHaveBeenCalledWith({
          Bucket: 'fromBucket',
          Key: 'fromKey',
        });
      });
    });
  });

  describe('.streamToS3', () => {
    const expectedResult = { return: 'from API' };
    beforeEach(() => {
      sut.api.upload = jest.fn().mockReturnValue({ promise: () => Promise.resolve(expectedResult) });
    });

    it('calls the API', async () => {
      await sut.streamToS3('testBucket', 'testKey', 'testStream');
      expect(sut.api.upload).toHaveBeenCalledWith({
        Body: 'testStream',
        Bucket: 'testBucket',
        Key: 'testKey',
      });
    });

    it('returns the API result', async () => {
      const result = await sut.streamToS3('testBucket', 'testKey', 'testStream');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('.listTagsForS3ObjectVersion', () => {
    const expectedResult = { return: 'from API' };
    beforeEach(() => {
      sut.api.getObjectTagging = jest.fn().mockReturnValue({ promise: () => Promise.resolve(expectedResult) });
    });

    it('calls the API', async () => {
      await sut.listTagsForS3ObjectVersion('testBucket', 'testKey', 'objectVersionId');
      expect(sut.api.getObjectTagging).toHaveBeenCalledWith({
        Bucket: 'testBucket',
        Key: 'testKey',
        VersionId: 'objectVersionId',
      });
    });
  });
});
