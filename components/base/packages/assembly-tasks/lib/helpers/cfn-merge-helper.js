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

// Certain elements in AWS CloudFormation may be single value or arrays
const cfnElementsMayBeArrays = _.map(['Statement', 'AWS', 'Service', 'Action', 'Resource', 'NotResource'], _.toLower);

// Name of identifier property for CFN array elements
const lowerCaseObject = obj => _.mapKeys(_.mapValues(obj, _.toLower), (v, k) => _.toLower(k));
const idProperties = lowerCaseObject({
  Statement: 'Sid',
  Policies: 'PolicyName',
});

/**
 * Certain elements in AWS CloudFormation may be single value or arrays.
 * This function returns true if the given element is such element.
 *
 * @param cfnElementName
 * @returns {boolean}
 */
function mayBeArray(cfnElementName) {
  return _.includes(cfnElementsMayBeArrays, _.toLower(cfnElementName));
}

// Certain elements in AWS CloudFormation arrays but should not merge by concatenating
const cfnElementsArraysReplaceNoConcatenate = _.map(
  ['Fn::If', 'Fn::Equals', 'Fn::Not', 'Fn::Or', 'Fn::And'],
  _.toLower,
);

/**
 * Certain elements in AWS CloudFormation are arrays, but should not concatenate on merge.
 * This function returns true if the given element is such element.
 *
 * @param cfnElementName
 * @returns {boolean}
 */
function arrayReplaceNotConcatenate(cfnElementName) {
  return _.includes(cfnElementsArraysReplaceNoConcatenate, _.toLower(cfnElementName));
}

/**
 * Returns the name of identifier property for the given AWS CloudFormation element name
 * E.g., return 'sid' for 'statement'
 * @param cfnElementName Name of the AWS CloudFormation (case insensitive)
 * @returns {*} The name of the identifier property for the given cfn element.
 * Returns undefined, if the given element does not have any identifier property
 */
function getIdPropName(cfnElementName) {
  return idProperties[_.toLower(cfnElementName)];
}

/**
 * Return the specified property value from the given object treating the given property name case-insensitive
 *
 * E.g., getPropCaseInsensitive({ Prop:'value' }, 'prop') => 'value'
 *
 * @param obj
 * @param prop
 * @returns {undefined|*}
 */
function getPropCaseInsensitive(obj, prop) {
  const keys = _.keys(obj);
  // eslint-disable-next-line no-restricted-syntax
  for (const k of keys) {
    if (_.toLower(k) === _.toLower(prop)) {
      return obj[k];
    }
  }
  return undefined;
}

/**
 * Function to de-duplicate elements from the given value and merge elements having
 * the same identifier property. Useful when merging IAM statements.
 *
 * For example,
 *
 * value = [
 *  { sid: 's1', Action: ['a1','a2'], Effect: 'Allow', Resource: 'r1', Principal: 'p1' },
 *  { Effect: 'Allow', Resource: 'r2', Principal: 'p2' },
 *  { sid: 's1', Action: ['a1','a2'], Effect: 'Allow', Resource: 'r1', Principal: 'p1' },
 *  { sid: 's2', Action: ['a3','a4'], Effect: 'Allow', Resource: 'r1', Principal: 'p1' },
 * ]
 *
 * unique(value, 'sid') => [
 *  { Effect: 'Allow', Resource: 'r2', Principal: 'p2' },
 *  { sid: 's1', Action: [ 'a3', 'a4', 'a1', 'a2' ], Effect: 'Allow', Resource: 'r1', Principal: 'p1' },
 *  { sid: 's2', Action: [ 'a5', 'a6' ], Effect: 'Allow', Resource: 'r1', Principal: 'p1' }
 * ]
 *
 * @param value
 * @param idProp
 * @returns {unknown[]|*}
 */
function unique(value, idProp) {
  if (_.isArray(value) && !_.isEmpty(value)) {
    const arr = value;
    if (idProp) {
      const shallowCopy = [...arr];
      for (let i = 0; i < arr.length; i += 1) {
        const elmnt = arr[i];
        const elmntId = getPropCaseInsensitive(elmnt, idProp);
        if (elmntId) {
          const idx = _.findIndex(
            shallowCopy,
            val => val && val !== elmnt && getPropCaseInsensitive(val, idProp) === elmntId,
          );
          if (idx >= 0) {
            const other = shallowCopy[idx];
            shallowCopy[i] = cfnMerge(elmnt, other);
            shallowCopy[idx] = undefined;
          }
        }
      }
      return _.uniqWith(_.filter(shallowCopy, _.negate(_.isNil)), _.isEqual);
    }
    return _.uniqWith(value, _.isEqual);
  }
  return value;
}

function uniqueById(idProp) {
  return value => unique(value, idProp);
}

function cfnCustomizer(targetValue, srcValue, key) {
  // if the given cfn key is an array that should not be concatenated
  if (arrayReplaceNotConcatenate(key)) return undefined;

  // Check if the given cfn key may be an array
  if (mayBeArray(key) || _.isArray(targetValue) || _.isArray(srcValue)) {
    const uniqueByIdProp = uniqueById(getIdPropName(key));
    if (_.isArray(targetValue) && _.isArray(srcValue)) {
      // source and target are both arrays
      // For example, the target CFN may have
      // Action:
      //  - someAction
      // and source CFN may have
      // Action:
      //  - someOtherAction
      return uniqueByIdProp(_.concat(targetValue, srcValue));
    }
    if (_.isArray(targetValue) && srcValue && !_.isArray(srcValue)) {
      // target is an array but the source is not
      // For example, the target CFN may have
      // Action:
      //  - someAction
      // and source CFN may have
      // Action: someOtherAction
      targetValue.push(srcValue);
      return uniqueByIdProp(targetValue);
    }
    if (_.isArray(srcValue) && targetValue && !_.isArray(targetValue)) {
      // source value is an array but the target value is not (i.e., inverse of the above case)
      return uniqueByIdProp(_.concat([targetValue], srcValue));
    }
    if (srcValue && !_.isArray(srcValue) && targetValue && !_.isArray(targetValue)) {
      // source and target both are not arrays
      // For example, the target CFN may have
      // Action: someAction
      // and source CFN may have
      // Action: someOtherAction
      if (srcValue === targetValue) {
        return targetValue;
      }
      return uniqueByIdProp([targetValue, srcValue]);
    }
  }
  return undefined;
}

function cfnMerge(targetCfn, srcCfn) {
  return _.mergeWith(targetCfn, srcCfn, cfnCustomizer);
}

export { cfnMerge, cfnCustomizer };
