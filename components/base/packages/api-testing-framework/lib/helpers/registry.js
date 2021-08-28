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

/**
 * A generic key/value in-memory store. Its main api is set/get. The main advantage of having to use get/set methods
 * when accessing values is so that we can print an informative message when keys are missing, and we can provide
 * the 'optional' method for connivance. In addition, we also capture the sources of the values.
 * This allows us to list where each value came from and which component overrides another component's provided value.
 */
class Registry {
  constructor() {
    // A map of the keys and values. However, the values are objects that contain the value and the sources
    // where the value came from.  An example of the content can be:
    // {'key': { value: <value>: sources: [{ name: <component>, file: <file> }] }}
    // With this data structure we are able to list where each value came from and which component
    // overrides another component's value.
    this.content = {};
  }

  set(key, value, source = {}) {
    if (_.isEmpty(key)) throw this.errorKeyOrValueNotProvided(key);
    if (_.isUndefined(value)) throw this.errorKeyOrValueNotProvided(key);

    if (_.isEmpty(source)) throw this.errorInvalidSource(key, value);
    const { name, file } = source;

    if (_.isEmpty(name)) throw this.errorInvalidSource(key, value);
    if (_.isEmpty(file)) throw this.errorInvalidSource(key, value);
    const sourceEntry = { name, file };

    // This is the array that contains all the components that overrode the setting value
    const sources = _.get(this.content[key], 'sources', []);

    // We add the source entry at the beginning of the array indicating that this is the component that
    // overrode the setting value
    sources.unshift(sourceEntry);
    this.content[key] = { value, sources };
  }

  get(key) {
    const value = _.get(this.content[key], 'value');
    if (_.isEmpty(value) && !_.isBoolean(value)) throw this.errorKeyNotFound(key);

    return value;
  }

  optional(key, defaultValue) {
    const value = _.get(this.content[key], 'value');
    if (_.isNil(value) || (_.isString(value) && _.isEmpty(value))) return defaultValue;

    return value;
  }

  has(key) {
    return _.has(this.content, key);
  }

  // Given a map of the key/value, merge it to the existing content
  merge(map, source) {
    _.forEach(map, (value, key) => {
      this.set(key, value, source);
    });
  }

  entries() {
    const result = {};
    _.forEach(this.content, (entry, key) => {
      result[key] = entry.value;
    });
    return result;
  }

  // Subclasses can override this method to return their own custom error message
  errorInvalidSource(key, value) {
    return errors.invalidSource(key, value);
  }

  // Subclasses can override this method to return their own custom error message
  errorKeyOrValueNotProvided(key) {
    return errors.keyOrValueNotProvided(key);
  }

  // Subclasses can override this method to return their own custom error message
  errorKeyNotFound(key) {
    return errors.keyNotFound(key);
  }
}

// Wraps around an instance of the registry and makes the 'set()' method use the provided source.
// This way users of the wrapper registry don't have to worry about supplying the source object.
function registryWrapper({ registry, source }) {
  return {
    get: (key) => registry.get(key),
    set: (key, value, givenSource) => registry.set(key, value, givenSource || source),
    merge: (map, givenSource) => registry.merge(map, givenSource || source),
    has: (key) => registry.has(key),
    entries: () => registry.entries(),
  };
}

module.exports = { Registry, registryWrapper };
