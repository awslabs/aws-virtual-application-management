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

// const path = require('path');
// const { promisify } = require('util');
// const exec = promisify(require('child_process').exec);
//
// const exampleDirectory = path.resolve(__dirname, '../examples/basic');
//
// const serverlessBin = path.resolve(__dirname, '../node_modules/.bin/sls');

// TODO: The following test fails because the setting helper needs to talk to STS to get current acc info.
//  The setting helper code executes in a separate process and can't be easily mocked. So, if the machine where the test is running does
//  not have default AWS profile or AWS IAM credentials with permissions to call STS available via the default
//  credentials provider chain the test fails
// TODO: Figure out different way of testing this or mocking
/*
test('merges yaml settings files used by serverless', async () => {
  // const { stdout } = await exec(`${serverlessBin} -s alice print`, {
  //   cwd: exampleDirectory,
  // });
  // expect(stdout).toMatchSnapshot();
});
*/
test('TESTS IN THIS FILE ARE TEMPORARILY DISABLED', async () => {
  // const { stdout } = await exec(`${serverlessBin} -s alice print`, {
  //   cwd: exampleDirectory,
  // });
  // expect(stdout).toMatchSnapshot();
});
