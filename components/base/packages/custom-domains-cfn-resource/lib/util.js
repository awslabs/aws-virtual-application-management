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

function isObject(v) {
  return v !== undefined && v != null && v.constructor === Object;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function deepEqualObjectProperties(a, b, depth = 0) {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  if (!isObject(a) || !isObject(b)) return false;
  const keys = new Set();
  Object.keys(a).forEach(key => keys.add(key));
  Object.keys(b).forEach(key => keys.add(key));
  for (const key of keys) {
    if (!deepEqualObjectProperties(a[key], b[key], depth + 1)) return false;
  }
  return true;
}

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

const fnFail = (error, cause) => {
  const throwable = new Error(error);
  if (cause && typeof cause.stack === 'string') {
    throwable.stack += `\nCaused by: ${cause.stack}`;
  }
  throw throwable;
};

// assumes given argument is a string
// returns true iff it looks like an ARN
function mayBeArn(argument) {
  const parts = (argument || '').split(':', 6);
  return parts.length === 6 && parts[0] === 'arn' && !parts.includes('');
}

// form a closure of an object:
//  if it has sub-objects like { a: { b: { c: foo}}}, add the following properties (recursive):
//    ['a.b']: { c: foo }
//    ['a.b.c']: foo
// In this way, in the cloudformation the !GetAtt can access each property directly, no matter on which how deeply nested
function closure(param) {
  const result = {};
  const closureRec = (prefix, p) => {
    if (!isObject(p)) return;
    for (const [key, value] of Object.entries(p)) {
      result[`${prefix}${key}`] = value;
      closureRec(`${prefix}${key}.`, value);
    }
  };

  closureRec('', param);
  return result;
}

export { isObject, sleep, deepEqualObjectProperties, isObjectEmpty, fnFail, mayBeArn, closure };
