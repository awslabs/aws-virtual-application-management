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

export type IntervalFunction = (attemptCount: number, baseInterval?: number) => number;

export function toVersionString(num: any): string;
export function parseVersionString(str: any): number;
export function runAndCatch(fn: any, handler: any, code?: string): Promise<any>;
/**
 * A utility interval function for exponential back-off strategy. (i.e., intervals of 1, 2, 4, 8, 16 .. seconds)
 *
 * @param {Number} attemptCount
 * @param {Number} baseInterval
 * @return {Number}
 */
export function exponentialInterval(attemptCount: number, baseInterval?: number): number;
/**
 * A utility interval function for liner back-off strategy. (i.e., intervals of 1, 2, 3, 4, 5 .. seconds)
 *
 * @param {Number} attemptCount
 * @param {Number} baseInterval
 * @return {Number}
 */
export function linearInterval(attemptCount: number, baseInterval?: number): number;
/**
 * Retries calling a function as many times as requested by the 'times' argument. The retries are done with
 * back-offs specified by the 'intervalFn'. By default, it uses {@link exponentialInterval} function to pause
 * between each retry with exponential back-off (i.e., intervals of 1, 2, 4, 8, 16 .. seconds)
 *
 * @param {Function} fn - the fn to retry if it is rejected ( "fn" must return a promise )
 *
 * @param {Number} maxAttempts - maximum number of attempts calling the function. This includes first attempt and all
 * retries.
 * @param {Function} intervalFn - The interval function to decide the pause between the attempts. The function is
 * invoked with one argument 'attempt' number. The 'attempt' here is the count of calls attempted so far. For
 * example, if the 'fn' fails during the first attempt then the 'intervalFn' is called with attempt = 1. The
 * intervalFn is expected to return the pause time in milliseconds to wait before making the next 'fn' call attempt.
 *
 * @returns {Promise<*>} The promise returned by the 'fn'. The returned promise will be rejected with the error thrown
 * by 'fn' if the 'fn' still fails after the specified number of attempts.
 */
export function retry<T>(fn: () => Promise<T>, maxAttempts?: number, intervalFn?: IntervalFunction): Promise<T>;
/**
 * A utility function to process given items in sequence of batches. Items in one batch are processed in-parallel but
 * all batches are processed sequentially i..e, processing of the next batch is not started until the previous batch is
 * complete.
 *
 * @param items Array of items to process
 * @param batchSize Number of items in a batch
 * @param processorFn A function to process the batch. The function is called with the item argument.
 * The function is expected to return a Promise with some result of processing the item. If the "processorFn" throws an
 * error for any item, the "processInBatches" function will fail immediately. Processing of other items in that batch
 * may be already in-flight at that point. Due to this, if you need to handle partial batch failures or if you need
 * fine grained error handling control at individual item level, you should handle errors in the "processorFn" itself
 * (using try/catch or Promise.catch etc) and make sure that the "processorFn" does not throw any errors.
 *
 * @returns {Promise<Array>}
 */
export function processInBatches(items: any, batchSize: any, processorFn: any): Promise<any[]>;
/**
 * A utility function that processes items sequentially. The function uses the specified processorFn to process
 * items in the given order i.e., it does not process next item in the given array until the promise returned for
 * the processing of the previous item is resolved. If the processorFn throws error (or returns a promise rejection)
 * this functions stops processing next item and the error is bubbled up to the caller (via a promise rejection).
 *
 * @param items Array of items to process
 * @param processorFn A function to process the item. The function is called with the item argument.
 * The function is expected to return a Promise with some result of processing the item.
 *
 * @returns {Promise<Array>}
 */
export function processSequentially(items: any, processorFn: any): Promise<any[]>;
/**
 * Returns a promise that will be resolved in the requested time, ms.
 * Example: await sleep(200);
 * https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
 *
 * @param ms wait time in milliseconds
 *
 * @returns a promise, that will be resolved in the requested time
 */
export function sleep(ms: any): Promise<any>;
/**
 * Returns a random integer from the uniform range [baseNumber * (1 - fuzzing), baseNumber * (1 + fuzzing)].
 * @param {Number} baseNumber - Base number.
 * @param {Number} fuzzing - Percentage of fuzzing that determines the width of the range. Default value is 0.3.
 */
export function fuzz(baseNumber: number, fuzzing?: number): number;
/**
 * Generates a random alphanumeric string of a given length.
 * @param {Number} strLength
 */
export function randomString(strLength?: number): string;
/**
 * A utility function that returns a cumulative list by paginating through and calling the provided "listingFn"
 * recursively with appropriate page token
 *
 * @param listingFn An async function that returns list of items for a given page.
 * The function is expected to have signature "pageToken => Promise({ list, nextPageToken })"
 * @param pageToken
 * @returns {Promise<*|*[]>}
 */
export function paginatedList(listingFn: any, pageToken: any): Promise<any | any[]>;
/**
 * A utility function that finds an element that the predicate returns truthy for by paginating through and calling the
 * provided "listingFn" recursively with appropriate page token.
 *
 * @param listingFn An async function that returns list of items for a given page.
 * The function is expected to have signature "pageToken => Promise({ list, nextPageToken })"
 * @param predicate
 * @param pageToken
 * @returns {Promise<*>}
 */
export function paginatedFind(listingFn: any, predicate: any, pageToken: any): Promise<any>;
export function generateId(prefix?: string): Promise<string>;
export function generateIdSync(prefix?: string): string;
/**
 * A utility function for creating a SHA256 hash for the given string
 *
 * @param {String} strData
 */
export function createHash(strData: string): any;
