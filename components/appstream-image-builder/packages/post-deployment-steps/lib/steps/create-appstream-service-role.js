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

import Service from '@aws-ee/base-services-container/lib/service';
import { sleep } from '@aws-ee/base-services/lib/helpers/utils';

class CreateAppStreamServiceRole extends Service {
  constructor() {
    super();
    this.dependency(['aws']);
  }

  async createAppStreamServiceRole() {
    await this.createServiceRole('AmazonAppStreamServiceAccess', 'AmazonAppStreamServiceAccess', 'appstream');
  }

  async createApplicationAutoScalingForAmazonAppStreamAccessRole() {
    await this.createServiceRole(
      'ApplicationAutoScalingForAmazonAppStreamAccess',
      'ApplicationAutoScalingForAmazonAppStreamAccess',
      'application-autoscaling',
    );
  }

  async createServiceRole(roleName, policyName, serviceName) {
    const [aws] = await this.service(['aws']);

    const iam = new aws.sdk.IAM();

    try {
      await iam.getRole({ RoleName: roleName }).promise();
      this.log.info(`${roleName} role already exists in the target account`);
    } catch (error) {
      if (error.code === 'NoSuchEntity') {
        this.log.info(`${roleName}  role does not exist in the target account - creating now`);
        // Create the role
        const assumeRolePolicyDocument = {
          Version: '2012-10-17',
          Statement: [
            { Effect: 'Allow', Principal: { Service: `${serviceName}.amazonaws.com` }, Action: 'sts:AssumeRole' },
          ],
        };
        await iam
          .createRole({
            AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument),
            Path: '/service-role/',
            RoleName: roleName,
          })
          .promise();
        await iam
          .attachRolePolicy({
            PolicyArn: `arn:aws:iam::aws:policy/service-role/${policyName}`,
            RoleName: roleName,
          })
          .promise();
        this.log.info(`${roleName}  created successfully - allowing time for role propagation`);
        // TODO: Find a better way to check for role propagation
        // Wait 20 s for the role to propagate
        await sleep(20000);
        this.log.info(`Continuing - ${roleName}  role should be propagated`);
      } else {
        // If it is some other error just throw
        throw error;
      }
    }
  }

  async execute() {
    await this.createAppStreamServiceRole();
    await this.createApplicationAutoScalingForAmazonAppStreamAccessRole();
  }
}

export default CreateAppStreamServiceRole;
