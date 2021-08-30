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
import path from 'path';
import { mergeSettings as mergeSettingsFactory } from '@aws-ee/base-serverless-settings-helper';

const validate = (keys, values, language, componentName) => {
  if (!_.isEmpty(values[undefined])) {
    throw new Error(
      `An undefined key is being used for language '${language}' and has a value of '${values[undefined]}'`,
    );
  }

  _.forIn(keys, (keyValue, key) => {
    if (_.isEmpty(values[keyValue])) {
      throw new Error(`Missing value for key '${key}' in language '${language}' within component '${componentName}'.`);
    }
  });
};

const collectTranslationsForLanguages = ({ languages, keys, allTranslations, componentName, slsPlugin }) => {
  const translations = _.reduce(
    languages,
    (result, language) => {
      if (_.has(allTranslations, language)) {
        slsPlugin.cli.log(`INFO: validating translations for ${componentName} for language ${language}`);
        // Get the translations for the specfic language
        const trans = allTranslations[language];
        // Validate that there is a translation within this language for each of the expected keys defined by this component.
        validate(keys, trans.values, language, componentName);
        return { ...result, [language]: trans };
      }
      throw new Error(
        `A request for language '${language}' was made within component '${componentName}' but no translations were available.`,
      );
    },
    {},
  );
  return translations;
};

const mergeI18nSupportPlugin = ({ keys, translations: allTranslations, componentName, namespace }) => {
  const getTasks = async (existingTasks, assemblyInfo, slsPlugin, _pluginRegistry) => {
    const settingsDir = path.join(assemblyInfo.projectRootDir, 'main/config/settings');
    const stage = _.get(slsPlugin, 'options.stage');
    const mergeSettings = mergeSettingsFactory(__dirname, [
      path.join(settingsDir, '.defaults.yml'),
      path.join(settingsDir, `${stage}.yml`),
    ]);

    const { supportedLanguages, defaultLanguage } = await mergeSettings(slsPlugin.serverless);

    if (_.isEmpty(supportedLanguages)) {
      slsPlugin.cli.warn(
        `No internationalization has been configured. Check the 'supportedLanguages' fields in the solution settings files.`,
      );
      return existingTasks;
    }

    let suppLanguages;
    try {
      suppLanguages = JSON.parse(supportedLanguages);
    } catch (e) {
      slsPlugin.cli.error(
        "ERROR: Invalid JSON supplied for 'supportedLanguages' field in settings.\nPlease check your .defaults.yml",
      );
      throw e;
    }

    // The input from the ./settings/.defaults.yml may look like the following
    //    supportedLanguages: '{"en":"en", "en-US":"en", "en-GB":"en", "en-AU":"en", "ja":"ja"}'
    //    defaultLanguage: 'en'
    // The output would be ['en', 'ja'] as they are the unique languages across both "supportedLanguages" and "defaultLanguage"
    // We then expect to find translations for both 'en' and 'ja' within 'allTranslations' for this particular component.
    const languages = _.uniq(_.values({ ...suppLanguages, defaultLanguage }));

    return [
      ...existingTasks,
      () => {
        const translations = collectTranslationsForLanguages({
          languages,
          keys,
          allTranslations,
          componentName,
          slsPlugin,
        });
        // Merge the translations from the current component with those already attached to assemblyInfo so that it can later be output into the .generated-solution
        assemblyInfo.i18nAccumulator = _.merge(assemblyInfo.i18nAccumulator, { [namespace]: { keys, translations } });
      },
    ];
  };
  return {
    getTasks,
  };
};

export { mergeI18nSupportPlugin };
