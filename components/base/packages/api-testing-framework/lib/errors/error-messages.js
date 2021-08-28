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

const path = require('path');
const _ = require('lodash');

const EnhancedError = require('./enhanced-error');

// A map of code ids
const codes = _.keyBy([
  'dirNotProvided',
  'noStage',
  'noStagePath',
  'fileNotFound',
  'cannotReadFile',
  'notValidYaml',
  'scopeNotProvided',
  'invalidScope',
  'invalidCmpName',
  'dependencyMustBeString',
  'settingSourceInvalid',
  'settingNotAvailable',
  'awsServiceSourceInvalid',
  'awsServiceNotAvailable',
  'awsServiceNotProvided',
  'invalidSource',
  'keyOrValueNotProvided',
  'keyNotFound',
  'missingSettingsMemento',
]);

// A place to keep error messages that will be displayed by the framework. These messages are here because they can
// be long and might reduce readability of the code if they were directly embedded in the code that uses them.

const dirNotProvided = () =>
  new EnhancedError(
    codes.dirNotProvided,
    `No 'dir' is provided during the initialization of the tests.
    This value is usually specified in the jest.config.js when you make the call to
    'init' from @aws-ee/api-testing-framework. The 'dir' should be the folder of the
    api-integration-tests\n`,
  );

const noStage = () =>
  new EnhancedError(
    codes.noStage,
    `No "stage" argument is passed. Please pass the stage name via the command line.
    The "stage" is your yaml configuration file name (without .yml).
    Example: $ pnpm test -- --stage=<stage name>
    IMPORTANT: notice the additional '--', this is needed\n`,
  );

const stagePathNotProvided = () =>
  new EnhancedError(
    codes.noStagePath,
    `No 'stageFilePath' is provided during the initialization of the tests.
    This value is usually specified in the jest.config.js when you make the call to
    'init' from @aws-ee/api-testing-framework. The 'stageFilePath' should be the path to
    the folder where the <stage>.yml file is located, but without the file name itself\n`,
  );

const fileNotFound = (file) =>
  new EnhancedError(
    codes.fileNotFound,
    `The file "${path.basename(file)}" in folder "${path.dirname(file)}" is not found.
    Check if you didn't misspell the file/dir name
    Check if the file/dir exists in this exact path ${file}
    Check if you have read permission to the file/dir\n`,
  );

const cannotReadFile = (file, message) =>
  new EnhancedError(
    codes.cannotReadFile,
    `Unable to read file "${path.basename(file)}" in folder "${path.dirname(file)}",
    because "${message}".
    Check that you have read permission on the file "${file}"\n`,
  );

const notValidYaml = (file, message) =>
  new EnhancedError(
    codes.notValidYaml,
    `It seems that the file "${path.basename(file)}" in folder "${path.dirname(file)}"
    is malformed and is not a valid yaml - "${message}\n`,
  );

const scopeNotProvided = () =>
  new EnhancedError(
    codes.scopeNotProvided,
    `No 'scope' is provided during the initialization of the tests.
    This value is usually specified in the jest.config.js when you make the call to
    'init' from @aws-ee/api-testing-framework. The 'dir' should be either
    'component' or 'solution'\n`,
  );

const invalidScope = (scope) =>
  new EnhancedError(
    codes.invalidScope,
    `scope "${scope}" is not supported. It can either be 'component' or 'solution'.
    This value is usually specified in the jest.config.js when you make the call to
    'init' from @aws-ee/api-testing-framework\n`,
  );

const invalidCmpName = (name, reason, file) =>
  new EnhancedError(
    codes.invalidCmpName,
    `The component name "${name}" is invalid. ${reason}.
    This problem is in file "${file}"\n`,
  );

const dependencyMustBeString = (name, dependency, file) =>
  new EnhancedError(
    codes.dependencyMustBeString,
    `The component "${name}" at "${file}"
    has a dependency '${JSON.stringify(dependency)}' that is not a string. At this time, only strings
    are supported, so you can't have an object listing the name and the version. To fix the
    issue, only list the name of the components in the dependencies section.\n`,
  );

const settingSourceInvalid = (key, value) =>
  new EnhancedError(
    codes.settingSourceInvalid,
    `You tried to provide a setting "${key}" = "${value}", but you didn't provide the correct format for the
    source information. For example, you need to provide the name and location of the component that is adding
    the setting. A typical usage would be settings.set(<key>, <value>, { name, file }). If you are adding
    the setting from the solution, you can specify 'solution' as the name of the component.\n`,
  );

const settingNotAvailable = (key) =>
  new EnhancedError(codes.settingNotAvailable, `The "${key}" setting value is either empty or not provided.\n`);

const awsServiceSourceInvalid = (name) =>
  new EnhancedError(
    codes.awsServiceSourceInvalid,
    `You tried to provide an aws service class "${name}", but you didn't provide the correct format for the
    source information. For example, you need to provide the name and location of the component that is adding
    the class. A typical usage would be registry.set(<name>, <class>, { name: <can be the component name, framework
    or solution>, file }).\n`,
  );

const awsServiceNotAvailable = (name) =>
  new EnhancedError(
    codes.awsServiceNotAvailable,
    `The "${name}" aws service class is not provided. It seems that neither the components nor 
    the solution registered this service. The registration happens under the support/aws/services folders.
    Is it possible that you misspelled the service name?\n`,
  );

const awsServiceNotProvided = (name) =>
  new EnhancedError(
    codes.awsServiceNotProvided,
    `You tried to register aws service with name "${name}" but you either didn't provide the name
    or did not provide the class.\n`,
  );

const invalidSource = (key, value) =>
  new EnhancedError(
    codes.invalidSource,
    `You tried to register a "${key}" = "${value}", but you didn't provide the correct format for the
    source information. For example, you need to provide the name and location of the component that
    is registering the value. A typical usage would be <registry>.set(<key>, <value>, { name, file }).\n`,
  );

const keyOrValueNotProvided = (name) =>
  new EnhancedError(
    codes.keyOrValueNotProvided,
    `You tried to register a key "${name}" but you either didn't provide the name or did not provide the value.\n`,
  );

const keyNotFound = (key) =>
  new EnhancedError(codes.keyNotFound, `The "${key}" value is either empty or not provided.\n`);

const missingSettingsMemento = () =>
  new EnhancedError(
    codes.missingSettingsMemento,
    `The settings information is found in jest globals.
     check jest.config.js to see if it contains the logic to take the output from the bootstrap function
     and use it for jest globals.\n`,
  );

module.exports = {
  dirNotProvided,
  noStage,
  stagePathNotProvided,
  fileNotFound,
  cannotReadFile,
  notValidYaml,
  scopeNotProvided,
  invalidScope,
  invalidCmpName,
  dependencyMustBeString,
  settingSourceInvalid,
  settingNotAvailable,
  awsServiceSourceInvalid,
  awsServiceNotAvailable,
  awsServiceNotProvided,
  invalidSource,
  keyOrValueNotProvided,
  keyNotFound,
  missingSettingsMemento,
};
