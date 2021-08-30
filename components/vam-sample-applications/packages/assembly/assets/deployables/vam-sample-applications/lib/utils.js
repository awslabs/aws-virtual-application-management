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

const aws = require('aws-sdk');
const fs = require('fs');
const yaml = require('yaml');
const _ = require('lodash');

const init = async () => {
  const stageName = process.argv[4];
  if (!stageName) {
    throw new Error("You must provide a 'stage' that matches one of the yaml files in /main/config/settings");
  }
  const config = loadConfig(stageName);
  // eslint-disable-next-line no-template-curly-in-string
  if (config.envName.toUpperCase() === '${OPT:STAGE}') {
    config.envName = stageName;
  }

  aws.config.update({ region: config.awsRegion });
  if (config.awsProfile) {
    const credentials = new aws.SharedIniFileCredentials({ profile: config.awsProfile });
    aws.config.credentials = credentials;
  }
  config.awsAccount = await determineAccount();
  return config;
};

const loadConfig = stageName => {
  const defaultSettings = loadYaml('main/config/settings/.defaults.yml');
  const stageSettings = loadYaml(`main/config/settings/${stageName}.yml`);
  const { awsRegion, solutionName, awsProfile, regionShortNamesMap, envName } = _.merge(defaultSettings, stageSettings);

  const regionName = regionShortNamesMap[awsRegion];

  return {
    stageName,
    awsRegion,
    regionName,
    solutionName,
    awsProfile,
    envName,
  };
};

const determineAccount = async () => {
  const sts = new aws.STS();
  const data = await sts.getCallerIdentity({}).promise();
  return data.Account;
};

const loadYaml = file => {
  const content = fs.readFileSync(file, 'utf8');
  const result = yaml.parse(content);
  return result;
};

module.exports = { init, loadConfig };
