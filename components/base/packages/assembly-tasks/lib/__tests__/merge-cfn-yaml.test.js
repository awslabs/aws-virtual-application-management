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
import fs from 'fs-extra';
import path from 'path';

import { copy, mergeCfnYamls } from '../index';
import { cfnYamlParser } from '../helpers/cfn-yaml-parser';
import { cfnMerge } from '../helpers/cfn-merge-helper';

const expectedMergedSettings1Yml = `
      setting1: FOO REPLACED WITH BAR
      setting2: !Sub https://\${ApiGatewayRestApi}.execute-api.\${self:custom.settings.awsRegion}.amazonaws.com/\${opt:stage}
      setting3: arn:aws:iam::\${self:custom.settings.awsAccountInfo.awsAccountId}:role/\${self:custom.settings.apiHandlerRoleName}
      setting4: Some setting added
    `;

const expectedMergedFunctionsYml = `
authenticationLayerHandler:
  handler: src/lambdas/authentication-layer-handler/handler.handler
  role: RoleAuthenticationLayerHandler
  tags: \${self:custom.tags}
  description: Handles the authentication layer for API handlers.
  environment:
    APP_PARAM_STORE_JWT_SECRET: \${self:custom.settings.paramStoreJwtSecret}
    APP_JWT_OPTIONS: \${self:custom.settings.jwtOptions}
    APP_FOO: NEW Value
    APP_BAR: !GetAtt SomeResource.SomeProp
apiHandler:
  handler: src/lambdas/api-handler/handler.handler
  role: RoleApiHandler
  tags: \${self:custom.tags}
  description: The API handler for all /api/* APIs
  events:
    - http:
        path: /api/authentication/public/provider/configs
        method: GET
        cors: true
    - http:
        path: /api/authentication/id-tokens
        method: POST
        cors: true
    - http:
        authorizer: authenticationLayerHandler
        path: /api
        method: GET
        cors: true
    - http:
        authorizer: authenticationLayerHandler
        path: /api/{proxy+}
        method: GET
        cors: true
    - http:
        authorizer: authenticationLayerHandler
        path: /api
        method: POST
        cors: true
    - http:
        authorizer: authenticationLayerHandler
        path: /api/{proxy+}
        method: POST
        cors: true
    - http:
        authorizer: authenticationLayerHandler
        path: /api
        method: PUT
        cors: true
    - http:
        authorizer: authenticationLayerHandler
        path: /api/{proxy+}
        method: PUT
        cors: true
    - http:
        authorizer: authenticationLayerHandler
        path: /api
        method: DELETE
        cors: true
    - http:
        authorizer: authenticationLayerHandler
        path: /api/{proxy+}
        method: DELETE
        cors: true
  environment:
    APP_CORS_ALLOW_LIST: \${self:custom.settings.corsAllowList}
    APP_CORS_ALLOW_LIST_LOCAL: \${self:custom.settings.corsAllowListLocal}
    APP_PARAM_STORE_JWT_SECRET: \${self:custom.settings.paramStoreJwtSecret}
    APP_JWT_OPTIONS: \${self:custom.settings.jwtOptions}
    APP_PARAM_STORE_ROOT: \${self:custom.settings.paramStoreRoot}
    APP_API_HANDLER_ARN: \${self:custom.settings.apiHandlerRoleArn}
    APP_API_URL: \${self:custom.settings.apiGatewayUrl}
`;

const expectedMergedCfnYml = `
Resources:
  AppDeployerRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: \${self:custom.settings.sourceAccountAppPipelineRole}
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/PowerUserAccess
      Policies:
        - PolicyName: CodeBuildDeployerPermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Action:
                  - iam:AttachRolePolicy
                  - iam:CreateRole
                  - iam:DeleteRole
                  - iam:DeleteRolePolicy
                  - iam:DetachRolePolicy
                  - iam:GetRole
                  - iam:GetRolePolicy
                  - iam:PassRole
                  - iam:PutRolePolicy
                  - iam:UpdateAssumeRolePolicy
                  - iam:*TagRole*
                Resource: '*'
                Effect: Allow
Outputs:
  AppDeployerRoleArn:
    Value: !GetAtt AppDeployerRole.Arn
`;

const expectedWithRemovalsCfnYml = `
Resources:
  AppDeployerRole:
    Type: AWS::IAM::Role
    Properties:
      Policies:
        - PolicyName: CodeBuildDeployerPermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Action:
                  - iam:SomeFakePermissionThatShouldBeAdded
                Resource: '*'
                Effect: Allow
              - Action:
                  - iam:AttachRolePolicy
                  - iam:CreateRole
                  - iam:DetachRolePolicy
                  - iam:GetRole
                  - iam:GetRolePolicy
                  - iam:PassRole
                  - iam:PutRolePolicy
                  - iam:UpdateAssumeRolePolicy
                  - iam:*TagRole*
                Resource: '*'
                Effect: Allow

Outputs:
  AppDeployerRoleArn:
    Value: !GetAtt AppDeployerRole.Arn
`;

describe('merge-cfn-yaml', () => {
  const tempDir = path.normalize(path.join(__dirname, './__data__/temp'));
  const slsPlugin = {
    cli: console,
  };

  const cleanup = async () => {
    // delete test temp dir
    await fs.rmdir(tempDir, { recursive: true });
  };
  beforeAll(async () => {
    // Do a clean start
    await cleanup();
    await fs.mkdirp(tempDir);
  });

  afterAll(async () => {
    await cleanup();
  });

  it(`(additive) merges cloudformation, functions, and settings yaml files correctly from one directory to other`, async () => {
    // BUILD
    const srcDir = path.normalize(path.join(__dirname, './__data__/source'));
    const targetDir = path.normalize(path.join(__dirname, './__data__/target'));

    // OPERATE
    // Copy all files from target directory to the temp directory
    const copyTask = await copy({
      pattern: '**/*',
      srcDir: targetDir,
      targetDir: tempDir,
      slsPlugin,
    });
    await copyTask();

    // Merge all yaml files including settings, cloudformation, and functions.yml files
    // from source directory to the temp directory
    const mergeTask = await mergeCfnYamls({
      from: { dir: srcDir, pattern: '**/*.yml' },
      to: { dir: tempDir },
      // eslint-disable-next-line no-console
      slsPlugin: { cli: { log: (...args) => console.log(...args) } },
    });
    await mergeTask();

    // CHECK
    const expectedSettings1 = await cfnYamlParser.unmarshal(expectedMergedSettings1Yml);
    const actualSettings1 = await cfnYamlParser.unmarshal(await fs.readFile(path.join(tempDir, 'test-settings-1.yml')));
    expect(expectedSettings1).toEqual(actualSettings1);

    const expectedSettings2 = (await fs.readFile(path.join(srcDir, 'test-settings-2.yml'))).toString('utf8');
    const actualSettings2 = (await fs.readFile(path.join(tempDir, 'test-settings-2.yml'))).toString('utf8');
    expect(actualSettings2).toEqual(expectedSettings2);

    const expectedFunctionsYml = await cfnYamlParser.unmarshal(expectedMergedFunctionsYml);
    const actualFunctionsYml = await cfnYamlParser.unmarshal(
      (await fs.readFile(path.join(tempDir, 'test-functions.yml'))).toString('utf8'),
    );
    expect(actualFunctionsYml).toEqual(expectedFunctionsYml);

    const expectedCfnYml = await cfnYamlParser.unmarshal(expectedMergedCfnYml);
    const actualCfnYml = await cfnYamlParser.unmarshal(
      (await fs.readFile(path.join(tempDir, 'test-cloudformation.yml'))).toString('utf8'),
    );
    expect(actualCfnYml).toEqual(expectedCfnYml);
  });

  it(`(additions + removals) merges yamls correctly where the merge should result in some elements removals`, async () => {
    // BUILD
    const srcDir = path.normalize(path.join(__dirname, './__data__/source'));
    const targetDir = path.normalize(path.join(__dirname, './__data__/target'));

    // OPERATE
    // Copy all files from target directory to the temp directory
    const copyTask = await copy({
      pattern: '**/*',
      srcDir: targetDir,
      targetDir: tempDir,
      slsPlugin,
    });
    await copyTask();

    // Merge all yaml files including settings, cloudformation, and functions.yml files
    // from source directory to the temp directory
    const mergeTask = await mergeCfnYamls({
      from: { dir: srcDir, pattern: '**/test-cloudformation-for-removals.yml' },
      to: { dir: tempDir },

      // A custom merge function to remove AWS CloudFormation elements after additive merge
      // The one below removes all Delete* actions from an AppDeployerRole
      mergeFn: (targetCfn, srcCfn) => {
        const result = cfnMerge(targetCfn, srcCfn);
        const appDeployerRole = _.get(result, 'Resources.AppDeployerRole');
        if (appDeployerRole) {
          // const actionsPath = 'Resources.AppDeployerRole.Properties.Policies[0].PolicyDocument.Statement[0].Action';
          const policiesPath = 'Resources.AppDeployerRole.Properties.Policies';
          const policy = _.find(_.get(result, policiesPath), { PolicyName: 'CodeBuildDeployerPermissions' });
          const statements = policy.PolicyDocument.Statement;
          _.forEach(statements, statement => {
            statement.Action = _.filter(statement.Action, a => !_.startsWith(a, 'iam:Delete'));
          });
        }
        return result;
      },
      // eslint-disable-next-line no-console
      slsPlugin: { cli: { log: (...args) => console.log(...args) } },
    });
    await mergeTask();

    // CHECK
    const expectedCfnYml = await cfnYamlParser.unmarshal(expectedWithRemovalsCfnYml);
    const actualCfnYml = await cfnYamlParser.unmarshal(
      (await fs.readFile(path.join(tempDir, 'test-cloudformation-for-removals.yml'))).toString('utf8'),
    );
    expect(actualCfnYml).toEqual(expectedCfnYml);
  });
});
