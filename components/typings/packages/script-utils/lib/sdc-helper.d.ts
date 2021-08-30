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

/**
 * A helper function to retrieve the fully resolved custom settings for a serverless project.
 * To use this function you must ensure that the 'sls print' command for your project does not output anything other than the resolved serverless.yml.
 * For example, please make sure that settings merge logging is turned off for your SDC in 'main/config/settings/.settings.js' by using the below extra options:
 *
 *  { loadedFile: null, missingFiles: null, emptyFiles: null }
 *
 * @param slsProjDir Path to the Serverless Framework Project directory i.e., a directory containing "serverless.yml" file.
 *
 * @returns {Promise<{*}>} An object containing the fully resolved project custom settings.
 */
export function getCustomSettings(slsProjDir: any, slsPlugin: any, pluginRegistry: any): Promise<{}>;
