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
import { cfnYamlParser } from '../cfn-yaml-parser';
import { cfnMerge } from '../cfn-merge-helper';

const testCases = [];

// ---------------------------------------------------------------------------------------
let testCase = 'merges simple cfn fragments: source and target contain different resources';
let srcCfn = `
Conditions:
  IsDev: !Equals ['\${self:custom.settings.envType}', 'dev']
  UseCustomDomain: !Not
    - !Equals ['\${self:custom.settings.hostedZoneId}', '']
  HasApiBasePath: !Not
    - !Equals ['\${self:custom.settings.apiBasePath}', '']
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: UseCustomDomain
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;
let targetCfn = `
Resources:
  DomainRecord:
    Type: AWS::Route53::RecordSetGroup
    Condition: UseCustomDomain
    Properties:
      HostedZoneId: \${self:custom.settings.hostedZoneId}
      RecordSets:
        - Name: \${self:custom.settings.domainName}
          Type: A
          AliasTarget:
            HostedZoneId: !GetAtt DomainName.DistributionHostedZoneId
            DNSName: !GetAtt DomainName.DistributionDomainName
  PathMapping:
    Type: AWS::ApiGateway::BasePathMapping
    Condition: UseCustomDomain
    Properties:
      BasePath: !If
        - HasApiBasePath
        - \${self:custom.settings.apiBasePath}
        - !Ref AWS::NoValue
      DomainName: !Ref DomainName
      RestApiId: !Ref ApiGatewayRestApi
      Stage: \${self:custom.settings.envName}
  `;
let expectedMergedCfn = `
Conditions:
  IsDev: !Equals ['\${self:custom.settings.envType}', 'dev']
  UseCustomDomain: !Not
    - !Equals ['\${self:custom.settings.hostedZoneId}', '']
  HasApiBasePath: !Not
    - !Equals ['\${self:custom.settings.apiBasePath}', '']
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: UseCustomDomain
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
  DomainRecord:
    Type: AWS::Route53::RecordSetGroup
    Condition: UseCustomDomain
    Properties:
      HostedZoneId: \${self:custom.settings.hostedZoneId}
      RecordSets:
        - Name: \${self:custom.settings.domainName}
          Type: A
          AliasTarget:
            HostedZoneId: !GetAtt DomainName.DistributionHostedZoneId
            DNSName: !GetAtt DomainName.DistributionDomainName
  PathMapping:
    Type: AWS::ApiGateway::BasePathMapping
    Condition: UseCustomDomain
    Properties:
      BasePath: !If
        - HasApiBasePath
        - \${self:custom.settings.apiBasePath}
        - !Ref AWS::NoValue
      DomainName: !Ref DomainName
      RestApiId: !Ref ApiGatewayRestApi
      Stage: \${self:custom.settings.envName}
  `;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'merges simple cfn fragments: source and target are same, order of CFN resource properties does not matter';
srcCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: SomeCondition
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

targetCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: SomeCondition
    Properties:
      # Properties in different order
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
      DomainName: \${self:custom.settings.domainName}
`;

expectedMergedCfn = targetCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'merges IAM policies correctly: source contains one statement and target contains multiple';
srcCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          Effect: Allow
          Action:
            - logs:CreateLogStream
          Resource:
            - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
`;
targetCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Statement:
          Effect: Allow
          Action:
            - logs:PutLogEvents
          Resource:
            - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*:log-stream:*"
`;

expectedMergedCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - logs:PutLogEvents
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*:log-stream:*"

          - Effect: Allow
            Action:
              - logs:CreateLogStream
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
`;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase =
  'merges IAM policies correctly: source and target both contain multiple statements with some overlapping statements';
srcCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogStream
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
          - Effect: Allow
            Action:
              - logs:PutLogEvents
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*:log-stream:*"
`;

targetCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:*
            Resource: '*'
          # The following statement is also there in source
          - Effect: Allow
            Action:
              - logs:PutLogEvents
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*:log-stream:*"
`;

expectedMergedCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:*
            Resource: '*'
          - Effect: Allow
            Action:
              - logs:PutLogEvents
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*:log-stream:*"
          - Effect: Allow
            Action:
              - logs:CreateLogStream
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
`;
testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase =
  'merges IAM policies correctly: source contains additional permissions in a statement with same SID as target';
srcCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'S1'
            Effect: Allow
            Action:
              - logs:CreateLogStream
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
`;

targetCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:*
            Resource: '*'
          - Sid: 'S1'
            Effect: Allow
            Action:
              - logs:PutLogEvents
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*:log-stream:*"
`;

expectedMergedCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:*
            Resource: '*'
          - Sid: 'S1'
            Effect: Allow
            Action:
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*:log-stream:*"
`;
testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'merges IAM policies correctly: source overrides Effect in a statement with same SID as target';
srcCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'S1'
            Effect: Deny
            Action:
              - dynamodb:DeleteItem
              - dynamodb:GetItem
              - dynamodb:PutItem            
          - Sid: 'S2'
            Effect: Allow
            Action:
              - logs:CreateLogStream
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
`;

targetCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:*
            Resource: '*'
          - Sid: 'S1'
            Effect: Allow
            Action:
              - dynamodb:Query
              - dynamodb:Scan
              - dynamodb:UpdateItem
            Resource:
              - !GetAtt [UsersDb, Arn]
              - !Sub '\${UsersDb.Arn}/index/*'
              - !GetAtt [AuthenticationProviderTypesDb, Arn]
              - !GetAtt [AuthenticationProviderConfigsDb, Arn]
              - !GetAtt [RevokedTokensDb, Arn]    
          - Sid: 'S2'
            Effect: Allow
            Action:
              - logs:CreateLogStream
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
`;

expectedMergedCfn = `
Resources:
  IamPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:*
            Resource: '*'
          - Sid: 'S1'
            Effect: Deny
            Action:
              - dynamodb:DeleteItem
              - dynamodb:GetItem
              - dynamodb:PutItem
              - dynamodb:Query
              - dynamodb:Scan
              - dynamodb:UpdateItem
            Resource:
              - !GetAtt [UsersDb, Arn]
              - !Sub '\${UsersDb.Arn}/index/*'
              - !GetAtt [AuthenticationProviderTypesDb, Arn]
              - !GetAtt [AuthenticationProviderConfigsDb, Arn]
              - !GetAtt [RevokedTokensDb, Arn]    
          - Sid: 'S2'
            Effect: Allow
            Action:
              - logs:CreateLogStream
            Resource:
              - !Sub "arn:\${AWS::Partition}:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/lambda/\${self:service}-\${self:custom.settings.envName}-*"
`;
testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase =
  'merges functions.yml correctly: source and target contain same lambda function with different environment variables including CFN intrinsic functions';
srcCfn = `
authenticationLayerHandler:
  environment:
    APP_PARAM_STORE_JWT_SECRET: \${self:custom.settings.paramStoreJwtSecret}
    APP_JWT_OPTIONS: \${self:custom.settings.jwtOptions}
`;

targetCfn = `
authenticationLayerHandler:
  handler: src/lambdas/authentication-layer-handler/handler.handler
  role: RoleAuthenticationLayerHandler
  tags: \${self:custom.tags}
  description: Handles the authentication layer for API handlers.
  environment:
    APP_FOO: !GetAtt [AuthenticationProviderTypesDb, Arn]
    APP_BAR: BAR
`;

expectedMergedCfn = `
authenticationLayerHandler:
  handler: src/lambdas/authentication-layer-handler/handler.handler
  role: RoleAuthenticationLayerHandler
  tags: \${self:custom.tags}
  description: Handles the authentication layer for API handlers.
  environment:
    APP_FOO: !GetAtt [AuthenticationProviderTypesDb, Arn]
    APP_BAR: BAR
    APP_PARAM_STORE_JWT_SECRET: \${self:custom.settings.paramStoreJwtSecret}
    APP_JWT_OPTIONS: \${self:custom.settings.jwtOptions}
`;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase =
  'merges conditional resources correctly: target contains multiple conditions but source contains only one that is already in target';
srcCfn = `
Conditions:
  IsDev: !Equals ['\${self:custom.settings.envType}', 'dev']
  UseCustomDomain: !Not
    - !Equals ['\${self:custom.settings.hostedZoneId}', '']
  HasApiBasePath: !Not
    - !Equals ['\${self:custom.settings.apiBasePath}', '']
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: UseCustomDomain
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

targetCfn = `
Conditions:
  IsDev: !Equals ['\${self:custom.settings.envType}', 'dev']
  UseCustomDomain: !Not
    - !Equals ['\${self:custom.settings.hostedZoneId}', '']
  HasApiBasePath: !Not
    - !Equals ['\${self:custom.settings.apiBasePath}', '']
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - UseCustomDomain
    - HasApiBasePath
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

expectedMergedCfn = targetCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase =
  'merges conditional resources correctly: target contains multiple conditions but source contains only one that is not in target';
srcCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: SomeOtherConditionNoThereInTarget
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

targetCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeCondition1
    - SomeCondition2
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

expectedMergedCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeCondition1
    - SomeCondition2
    - SomeOtherConditionNoThereInTarget
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase =
  'merges conditional resources correctly: source contains multiple conditions but target contains only one that is not in source';
srcCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeCondition1
    - SomeCondition2
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

targetCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: SomeOtherConditionNoThereInSrc
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

expectedMergedCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeOtherConditionNoThereInSrc
    - SomeCondition1
    - SomeCondition2
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase =
  'merges conditional resources correctly: source contains multiple conditions but target contains only one that is already there in source';
srcCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeCondition1
    - SomeCondition2
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

targetCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: SomeCondition2
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

expectedMergedCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeCondition2
    - SomeCondition1
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;
testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase =
  'merges conditional resources correctly: source and target both contain multiple conditions with some overlaps';
srcCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeCondition1
    - SomeCondition2
    Properties:
      DomainName: \${self:custom.settings.domainName}
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
`;

targetCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeCondition2
    - SomeCondition3
    Properties:
      # Properties in different order
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
      DomainName: \${self:custom.settings.domainName}
`;

expectedMergedCfn = `
Resources:
  DomainName:
    Type: AWS::ApiGateway::DomainName
    Condition:
    - SomeCondition2
    - SomeCondition3
    - SomeCondition1
    Properties:
      # Properties in different order
      CertificateArn: !Ref Certificate
      SecurityPolicy: TLS_1_2
      DomainName: \${self:custom.settings.domainName}
`;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'overrides Condition, as opposed to allow it to be array';
srcCfn = `
Outputs:
  Param:
    Condition: SomeCondition
`;

targetCfn = `
Outputs:
  Param:
    Condition: OtherCondition
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = '!If should replace body array as opposed to merging';
srcCfn = `
Outputs:
  Foo:
    !If
      - ConditionA
      - 12
      - 33
`;

targetCfn = `
Outputs:
  Foo:
    !If
      - ConditionB
      - 23
      - 99
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'Nested !If should replace body array as opposed to merging';
srcCfn = `
Outputs:
  Foo: !If
    - ConditionA
    - !If
      - ConditionB
      - value1
      - value2
    - value3
`;

targetCfn = `
Outputs:
  Foo: !If
    - ConditionC
    - !If
      - ConditionD
      - 23
      - 99
    - value4
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = '!Equals should replace body array as opposed to merging';
srcCfn = `
UseLargeInstance:
  !Equals
    - !Ref EnvironmentType
    - prod
`;

targetCfn = `
UseLargeInstance:
  !Equals [!Ref EnvironmentType, demo]
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'Nested !Equals should replace body array as opposed to merging';
srcCfn = `
IsProtectedEnvironment: 
  !Equals 
    - !Ref EnvironmentType 
    - !If
      - IsPoc
      - !If
        - !Equals [PocEnv, Demo] 
        - Demo
        - Dev
      - Production`;

targetCfn = `
IsProtectedEnvironment: 
  !Equals 
    - !Ref EnvironmentType 
    - !If
      - IsPoc
      - !If
        - !Equals [PocEnv, Demo] 
        - Demo
        - Dev
      - Prod
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = '!Not should replace body array as opposed to merging';
srcCfn = `
UseSmallInstance:
  !Not [!Ref EnvironmentType, prod]
`;

targetCfn = `
UseSmallInstance:
  !Not [!Ref EnvironmentType, demo]
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'Nested !Not should replace body array as opposed to merging';
srcCfn = `
UseSmallInstance:
  !Not 
    - !Or
      - Condition: SomeCondition
      - Condition: SomeOtherCondition
      - !Not 
        - !Equals [!Ref EnvironmentType, demo]`;

targetCfn = `
UseSmallInstance:
  !Not 
    - !Or
      - Condition: SomeCondition
      - Condition: SomeOtherCondition
      - !Not 
        - !Equals [!Ref EnvironmentType, dev]
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = '!Or should replace body array as opposed to merging';
srcCfn = `
MyOrCondition:
  !Or [!Equals [sg-mysggroup2, !Ref ASecurityGroup], Condition: SomeCondition, Condition: SomeOtherCondition]
`;

targetCfn = `
MyOrCondition:
  !Or [!Equals [sg-mysggroup1, !Ref ASecurityGroup], Condition: SomeOtherCondition]
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'Nested !Or should replace body array as opposed to merging';
srcCfn = `
MyOrCondition:
  !Or 
  - !Equals
    - sg-mysggroup2
    - !Ref ASecurityGroup
  - Condition: SomeCondition
  - Condition: SomeOtherCondition
  - !Or 
    - !Equals
      - sg-mysggroup3
      - !Ref ASecurityGroup
    - Condition: SomeCondition
    - Condition: SomeOtherCondition
`;

targetCfn = `
MyOrCondition:
  !Or 
  - !Equals [sg-mysggroup2, !Ref ASecurityGroup]
  - Condition: SomeCondition
  - Condition: SomeOtherCondition
  - !Or 
    - !Equals [sg-mysggroup2, !Ref ASecurityGroup]
    - Condition: Condition1
    - Condition: Condition2
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = '!And should replace body array as opposed to merging';
srcCfn = `
MyAndCondition:
  !And [!Equals [sg-mysggroup2, !Ref ASecurityGroup], Condition: SomeCondition, Condition: SomeOtherCondition]
`;

targetCfn = `
MyAndCondition:
  !And [!Equals [sg-mysggroup1, !Ref ASecurityGroup], Condition: SomeOtherCondition]
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
testCase = 'Nested !And should replace body array as opposed to merging';
srcCfn = `
MyAndCondition:
  !And 
  - !Equals
    - sg-mysggroup2
    - !Ref ASecurityGroup
  - Condition: SomeCondition
  - Condition: SomeOtherCondition
  - !And 
    - !Equals
      - sg-mysggroup3
      - !Ref ASecurityGroup3
    - Condition: SomeCondition
    - Condition: SomeOtherCondition
`;

targetCfn = `
MyAndCondition:
  !And 
  - !Equals [sg-mysggroup2, !Ref ASecurityGroup]
  - Condition: SomeCondition
  - Condition: SomeOtherCondition
  - !And 
    - !Equals [sg-mysggroup2, !Ref ASecurityGroup2]
    - Condition: Condition1
    - Condition: Condition2
`;

expectedMergedCfn = srcCfn;

testCases.push({ testCase, srcCfn, targetCfn, expectedMergedCfn });

// ---------------------------------------------------------------------------------------
describe('cfn-merge-helper', () => {
  let count = 0;
  _.map(testCases, test => {
    count += 1;
    return it.each`
      no       | testCase         | srcYml         | targetYml         | expectedMergedYml
      ${count} | ${test.testCase} | ${test.srcCfn} | ${test.targetCfn} | ${test.expectedMergedCfn}
    `(`$no: $testCase`, async ({ srcYml, targetYml, expectedMergedYml }) => {
      expect(srcYml).toBeDefined();
      expect(targetYml).toBeDefined();
      expect(expectedMergedYml).toBeDefined();

      // BUILD
      const src = await cfnYamlParser.unmarshal(srcYml);
      const target = await cfnYamlParser.unmarshal(targetYml);
      const mergedExpected = await cfnYamlParser.unmarshal(expectedMergedYml);

      // OPERATE
      const mergedActual = cfnMerge(target, src);

      // CHECK
      expect(mergedActual).toEqual(mergedExpected);
    });
  });
});
