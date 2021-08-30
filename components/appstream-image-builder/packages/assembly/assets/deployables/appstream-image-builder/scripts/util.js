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

#!/usr/bin/env node
// @ts-check
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { pushd, popd, exec, cat } = require('shelljs');
const aws = require('aws-sdk');

const { USER: user, STAGE: stageEnv } = process.env;
const [stageParam] = process.argv.slice(2);
const stage = stageParam || stageEnv || user;

const solutionRootDir = fs.realpathSync(path.join(`${__dirname}`, '../../..'));
const solutionDir = fs.realpathSync(path.join(`${__dirname}`, '../..'));
const configDir = path.join(solutionRootDir, 'config');
const intTestDir = path.join(solutionRootDir, 'integration-tests');

const settingsFilePaths = stage
  ? [path.join(configDir, 'settings', `${stage}.yml`), path.join(configDir, 'settings', '.defaults.yml')]
  : [path.join(configDir, 'settings', '.defaults.yml')];
const settings = cat(...settingsFilePaths);
const solutionName = findSplitAndSanitize({ input: settings, search: 'solutionName:' });
const awsRegion = findSplitAndSanitize({ input: settings, search: '^awsRegion:' }) || 'us-east-1';
const awsProfile = findSplitAndSanitize({ input: settings, search: '^awsProfile:' });

/**
 * This wraps shelljs.exec and throws an error if the exit code is not 0.
 * This is required because the fatal option in exec is broken :/
 * @param {string} command
 * @param {object} [options]
 */
function mustExec(command, options) {
  const result = exec(command, options);
  if (result.code !== 0) {
    if ('silent' in options && options.silent) {
      console.log(`Command ${command} stdout:`, result.stdout);
      console.log(`Command ${command} stderr:`, result.stderr);
    }
    throw new Error(`Command ${command} failed with code ${result.code}`);
  }
  return result;
}

/**
 * @typedef {{
 * execCommand: (string) => string,
 * exec: (string, object?) => object,
 * runScript: (string, object?) => object,
 * installRecursive: string
 * }} packageCommands
 * @type {{yarn: packageCommands, npm: packageCommands, pnpm: packageCommands}}}
 */
const supportedPackageManagerCommands = {
  yarn: {
    execCommand: command => `yarn run ${command}`,
    exec: (command, options = { silent: false }) => mustExec(`yarn run ${command}`, options),
    runScript: (command, options = { silent: false }) => mustExec(`yarn run ${command}`, options),
    installRecursive: 'yarn workspaces run install',
  },
  npm: {
    execCommand: command => `npx ${command}`,
    exec: (command, options = { silent: false }) => mustExec(`npx ${command}`, options),
    runScript: (command, options = { silent: false }) => mustExec(`npm run ${command}`, options),
    installRecursive: 'npm install',
  },
  pnpm: {
    execCommand: command => `pnpx ${command}`,
    exec: (command, options = { silent: false }) => mustExec(`pnpx ${command}`, options),
    runScript: (command, options = { silent: false }) => mustExec(`pnpm run ${command}`, options),
    installRecursive: 'pnpm recursive install',
  },
};

/**
 * Returns an object containing used commands for the selected
 * package manager.
 *
 * @returns {packageCommands | undefined}
 */
function initPackageManager() {
  const packageManager = 'pnpm';
  if (packageManager in supportedPackageManagerCommands) {
    return supportedPackageManagerCommands[packageManager];
  }
  return undefined;
}

/**
 * Uses the chosen package manager to install workspace dependencies.
 * @returns {void}
 */
function installDependencies() {
  const commands = initPackageManager();

  if (commands) {
    pushd('-q', solutionDir);
    mustExec(commands.installRecursive);
    popd('-q');
  }
}

/**
 * Disables the serverless statistics in a particular directory.
 * Either a component directory in `main/solution`, or specify
 * a directory relative to the root.
 * @param {{componentDir?: string, rootRelativeDir?: string}} params
 */
function disableStats({ componentDir, rootRelativeDir }) {
  if (!(componentDir || rootRelativeDir)) {
    console.log('Either a component directory or a directory relative to root must be specified.');
    process.exit(1);
  }
  const commands = initPackageManager();
  const dir = componentDir ? path.join(solutionDir, componentDir) : path.join(solutionRootDir, rootRelativeDir);
  pushd('-q', dir);
  // Disable serverless stats (only strictly needs to be done one time)
  commands.exec(`sls slstats --disable -s "${stage}"`);

  popd('-q');
}

/**
 * Deploys a Separately Deployable Component
 * @typedef {{componentDir: string, componentName: string}} componentInfo
 * @param {componentInfo} params
 */
function componentDeploy({ componentDir, componentName }) {
  console.log(`\nDeploying component: ${componentName} ...\n\n`);
  const commands = initPackageManager();

  pushd('-q', path.join(solutionDir, componentDir));
  commands.exec(`sls deploy -s "${stage}" -v`);
  console.log(`\nDeployed component: ${componentName} successfully \n\n`);
  popd('-q');
}

/**
 * Removes a Separately Deployable Component
 * @param {componentInfo & {
 *  shouldRemoveTestFn?: (componentInfo) => Promise<boolean>
 * }} params
 */
async function componentRemove({ componentDir, componentName, shouldRemoveTestFn = () => Promise.resolve(true) }) {
  if (await shouldRemoveTestFn({ componentDir, componentName })) {
    console.log(`\nRemoving component: ${componentName} ...\n\n`);
    const commands = initPackageManager();

    pushd('-q', path.join(solutionDir, componentDir));
    commands.exec(`sls remove -s "${stage}"`);
    popd('-q');
  } else {
    console.log(`\nNot removing component: ${componentName} ...\n\n`);
  }
}

/**
 * Returns true if the stack is currently deployed
 * @param {componentInfo} params
 */
async function testIfServerlessStackExists({ componentDir, componentName }) {
  const commands = initPackageManager();

  try {
    pushd('-q', path.join(solutionDir, componentDir));
    const stackName = findSplitAndSanitize({
      input: commands.exec(`sls info -s "${stage}"`, { silent: true }),
      search: 'stack:',
    });
    popd('-q');

    return !!stackName;
  } catch (error) {
    console.log(`Error: could not get info for ${componentName} - `, error.message);
    return false;
  }
}

/**
 * Takes ShellString output and a search regex. This function finds
 * the first line that matches and returns a trimmed substring sliced
 * after the search string match.
 * @param {{input: object, search: string, options?: string}} param
 * @returns {string}
 */
function findSplitAndSanitize({ input, search, options = '' }) {
  // shelljs grep function does not have an option to specify the number of matches
  // so the following is needed regardless of if that is used or not.
  /** @type {string} */
  const stdout = input.stdout;

  // Split into lines and find first match
  const regex = new RegExp(search, options);
  const matchingLine = stdout
    .split('\n')
    .filter(x => x)
    .find(line => regex.test(line));

  if (!matchingLine) {
    return '';
  }

  const [matchingText] = regex.exec(matchingLine);
  const index = matchingLine.indexOf(matchingText);
  return matchingLine.slice(index + matchingText.length).trim();
}

/**
 * Get an AWS SDK client appropriately configured to access the solution.
 * @param {{clientName: string, options?: object}} params
 */
function getClientSdk({ clientName, options = {} }) {
  const credentials = awsProfile ? new aws.SharedIniFileCredentials({ profile: awsProfile }) : undefined;
  return new aws[clientName]({ region: awsRegion, credentials, ...options });
}

/** @type {AWS.CloudFormation} */
const cfnClient = getClientSdk({ clientName: 'CloudFormation' });
/** @type {AWS.SSM} */
const ssmClient = getClientSdk({ clientName: 'SSM' });
/** @type {AWS.Lambda} */
const lambdaClient = getClientSdk({ clientName: 'Lambda' });
/** @type {AWS.S3} */
const s3Client = getClientSdk({ clientName: 'S3' });

/**
 * Returns the value of the specified Key in the outputs of the first provided CloudFormation stack.
 * @param {{stacks: AWS.CloudFormation.DescribeStacksOutput, key: string}} params
 * @returns {string}
 */
function findCfnOutput({ stacks, key }) {
  const outputs = stacks.Stacks[0].Outputs;
  const output = _.find(outputs, o => o.OutputKey === key);
  return output.OutputValue;
}

/**
 * Returns the value of a key in a stack matching the provided stackName.
 * @param {{stackName: string, key: string}} params
 * @returns {Promise<string>}
 */
async function getCfnOutput({ stackName, key }) {
  const stacks = await cfnClient.describeStacks({ StackName: stackName }).promise();
  return findCfnOutput({ stacks, key });
}

/**
 * Returns the value of an ssm parameter. The parameterPath provided is prefixed with
 * `/$stage/$solutionName` prior to querying.
 * @param {string} parameterPath
 * @returns {Promise<string>}
 */
async function getSSMParameterValue(parameterPath) {
  const parameterName = `/${stage}/${solutionName}${parameterPath}`;
  const parameter = await ssmClient.getParameter({ Name: parameterName, WithDecryption: true }).promise();
  return parameter.Parameter.Value;
}

/**
 * Invokes a lambda with the given function name.
 * @param {string} name
 */
async function invokeLambdaFunction(name) {
  const result = await lambdaClient.invoke({ FunctionName: name }).promise();

  if (!(result.StatusCode >= 200 && result.StatusCode <= 200)) {
    throw new Error(`Lambda invocation failed with error: ${result.FunctionError}`);
  }
  return result.Payload.toString();
}

/**
 * Returns information about the deployment.
 * @typedef {{
 *   websiteUrl: string,
 *   apiEndpoint: string,
 *   rootPassword: string,
 *   rootPasswordCommand: string,
 *   envName: string
 * }} deploymentInfo
 * @returns {Promise<deploymentInfo>}
 */
async function getInfo() {
  const commands = initPackageManager();

  pushd('-q', path.join(solutionDir, 'web-infra'));
  const stackNameWebInfra = findSplitAndSanitize({
    input: commands.exec(`sls info -s "${stage}"`, { silent: true }),
    search: 'stack:',
  });
  popd('-q');

  pushd('-q', path.join(solutionDir, 'backend'));
  const stackNameBackend = findSplitAndSanitize({
    input: commands.exec(`sls info -s "${stage}"`, { silent: true }),
    search: 'stack:',
  });
  popd('-q');

  const envName = stage;
  const websiteUrl = await getCfnOutput({ stackName: stackNameWebInfra, key: 'WebsiteUrl' });
  const apiEndpoint = await getCfnOutput({ stackName: stackNameBackend, key: 'ServiceEndpoint' });
  const rootPassword = await getSSMParameterValue('/user/root/password');
  const rootPasswordCommand = `
  aws ssm get-parameters --names /${stage}/${solutionName}/user/root/password --output text --region ${awsRegion} --profile $aws_profile --with-decryption --query 'Parameters[0].Value'
  `.trim();

  return { websiteUrl, apiEndpoint, rootPassword, rootPasswordCommand, envName };
}

/**
 * Prints information about the deployment to the console.
 */
async function showInfo() {
  const { websiteUrl, apiEndpoint, envName, rootPassword, rootPasswordCommand } = await getInfo();

  console.log('-------------------------------------------------------------------------');
  console.log('Summary:');
  console.log('-------------------------------------------------------------------------');
  console.log(`Env Name       : ${envName}`);
  console.log(`Solution       : ${solutionName}`);
  console.log(`Website URL    : ${websiteUrl}`);
  console.log(`API Endpoint   : ${apiEndpoint}`);
  // only show profile and root password when running in an interactive terminal
  if (process.stdout.isTTY) {
    if (awsProfile) {
      console.log(`AWS Profile    : ${awsProfile}`);
    }
    console.log(`Root Password  : ${rootPassword}`);
  } else {
    console.log(`Root Password  : execute "${rootPasswordCommand}"`);
  }
  console.log('-------------------------------------------------------------------------');
}

/**
 * Empties the contents of a bucket.
 * @param {string} name
 */
const emptyBucket = async name => {
  // First delete the objects in the bucket
  console.log(`Emptying bucket ${name}`);
  let isTruncated = true;
  let keyMarker;
  let versionIdMarker;
  const getDeleteInfo = ({ Key, VersionId }) => ({ Key, VersionId });
  while (isTruncated) {
    /** @type {AWS.S3.ListObjectVersionsOutput} */
    const response = await s3Client // eslint-disable-line no-await-in-loop
      .listObjectVersions({ Bucket: name, KeyMarker: keyMarker, VersionIdMarker: versionIdMarker })
      .promise();
    isTruncated = response.IsTruncated;
    keyMarker = response.KeyMarker;
    versionIdMarker = response.VersionIdMarker;

    const versions = [...response.DeleteMarkers.map(getDeleteInfo), ...response.Versions.map(getDeleteInfo)];
    if (versions.length > 0) {
      const deletionResponses = await s3Client.deleteObjects({ Bucket: name, Delete: { Objects: versions } }).promise(); // eslint-disable-line no-await-in-loop
      if (deletionResponses.Errors.length) {
        throw new Error(`Failed to delete all objects in bucket ${name}`);
      }
    }
  }
};

/**
 * Deletes the contents of a bucket and then deletes the bucket.
 * @param {string} name
 */
const removeBucket = async name => {
  // First delete the objects in the bucket
  await emptyBucket(name);

  console.log(`Deleting bucket ${name}`);

  // Now delete the bucket
  try {
    await s3Client.deleteBucket({ Bucket: name }).promise();
  } catch (error) {
    throw new Error(`Failed to delete bucket ${name} - ${error.message}`);
  }
};

/**
 * Empties all buckets in a stage that match a suffix. Useful for when you may not
 * have access to the complete bucket name.
 * @param {string} suffix
 */
const emptyBucketsBySuffix = async suffix => {
  const buckets = await s3Client.listBuckets().promise();
  const deploymentBuckets = buckets.Buckets.filter(
    // Stage is surrounded by '-', so add hyphens to prevent
    // 'rod' matching 'production'.
    bucket =>
      bucket.Name.includes(`-${stage}-`) && bucket.Name.includes(`-${solutionName}-`) && bucket.Name.endsWith(suffix),
  ).map(({ Name }) => Name);
  return Promise.all(deploymentBuckets.map(emptyBucket));
};

/**
 * Deletes all buckets in a stage that match a suffix. Useful for when you may not
 * have access to the complete bucket name.
 * @param {string} suffix
 */
const removeBucketsBySuffix = async suffix => {
  const buckets = await s3Client.listBuckets().promise();
  const deploymentBuckets = buckets.Buckets.filter(
    // Stage is surrounded by '-', so add hyphens to prevent
    // 'rod' matching 'production'.
    bucket =>
      bucket.Name.includes(`-${stage}-`) && bucket.Name.includes(`-${solutionName}-`) && bucket.Name.endsWith(suffix),
  ).map(({ Name }) => Name);
  return Promise.all(deploymentBuckets.map(removeBucket));
};

module.exports = {
  mustExec,
  stage,
  solutionRootDir,
  solutionDir,
  configDir,
  intTestDir,
  solutionName,
  awsRegion,
  awsProfile,
  initPackageManager,
  installDependencies,
  componentDeploy,
  componentRemove,
  testIfServerlessStackExists,
  disableStats,
  findSplitAndSanitize,
  getInfo,
  showInfo,
  getClientSdk,
  cfnClient,
  ssmClient,
  lambdaClient,
  s3Client,
  findCfnOutput,
  getCfnOutput,
  getSSMParameterValue,
  invokeLambdaFunction,
  emptyBucket,
  emptyBucketsBySuffix,
  removeBucket,
  removeBucketsBySuffix,
  settings,
};
