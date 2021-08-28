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

import aws from 'aws-sdk';

aws.config.region = process.env.AWS_REGION;
const route53 = new aws.Route53();
const cloudFormation = new aws.CloudFormation();

function getRegionalAcm({ Region: region }) {
  return new aws.ACM({ region });
}

export { route53, cloudFormation, getRegionalAcm };
