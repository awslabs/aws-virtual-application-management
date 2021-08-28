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

const _ = require('lodash');

const errors = require('../errors/error-messages');
const { Registry, registryWrapper } = require('../helpers/registry');

/**
 * All settings used during the tests are stored here. The main advantage of having to use get/set methods
 * when accessing settings values is so that we can print an informative message when keys are missing, and
 * we can provide the 'optional' method for convince. In addition, we also capture the sources of the settings.
 * This allows us to list where each setting came from and which component overrides another component's setting.
 */
class Settings extends Registry {
  errorInvalidSource(key, value) {
    return errors.settingSourceInvalid(key, value);
  }

  errorKeyOrValueNotProvided(key) {
    return errors.keyOrValueNotProvided(key);
  }

  errorKeyNotFound(key) {
    return errors.settingNotAvailable(key);
  }

  // Restores the state of the settings from the memento. We need to use the memento design pattern here because
  // we need to save and restore the settings, when we pass them via Jest globals.  Jest does not allow instances
  // of classes to be passed via Jest globals.
  setMemento(memento = {}) {
    this.content = _.cloneDeep(memento.content || {});
    return this;
  }

  getMemento() {
    return { content: _.cloneDeep(this.content) };
  }
}

function settingsWrapper({ settings, source }) {
  // Note: setMemento and getMemento are not available via the wrapper, which is not a problem
  return registryWrapper({ registry: settings, source });
}

module.exports = { Settings, settingsWrapper };
