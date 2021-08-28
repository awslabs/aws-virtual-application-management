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

export default S3Service;
declare class S3Service {
    init(): Promise<void>;
    api: any;
    sign({ files, expireSeconds }?: {
        files?: any[];
        expireSeconds?: number;
    }): Promise<any[]>;
    listObjects({ bucket, prefix }: {
        bucket: any;
        prefix: any;
    }): Promise<any[]>;
    /**
     * Parses given s3 location URI in the form "s3://some-bucket/some/path" form and returns an object containing s3BucketName and s3Key.
     * @param s3Location The s3 location uri in s3://some-bucket/some/path format
     * @returns {{s3BucketName: string, s3Key: string}} A promise that resolves to an object with shape {s3BucketName, s3Key}
     */
    parseS3Details(s3Location: any): {
        s3BucketName: string;
        s3Key: string;
    };
    /**
     * Checks if the given s3Location in the form "s3://some-bucket/some-path" exists
     * @param s3Location The s3 location uri in s3://some-bucket/some/path format
     * @returns {Promise<boolean>} A promise that resolves to a flag indicating whether the specified s3 location exists or not
     */
    doesS3LocationExist(s3Location: any): Promise<boolean>;
    moveObject(rawData: any): Promise<void>;
    streamToS3(bucket: any, toKey: any, inputStream: any): Promise<any>;
    listTagsForS3ObjectVersion(bucket: any, key: any, objectVersionId: any): Promise<any>;
    addTagToS3ObjectVersion(bucket: any, key: any, objectVersionId: any, tag: any): Promise<any>;
    removeTagFromS3ObjectVersion(bucket: any, key: any, objectVersionId: any, tag: any): Promise<void>;
}
