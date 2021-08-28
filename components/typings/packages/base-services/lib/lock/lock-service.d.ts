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

export default LockService;
declare class LockService {
    init(): Promise<void>;
    _getter: () => any;
    _updater: () => any;
    _query: () => any;
    _deleter: () => any;
    /**
     * Exclusively obtains a write lock and returns a write token if the lock is available or returns undefined if the lock is not available.
     *
     * @param {{id: string, expiresIn: number}} lockInfo Lock info with 'id' of the lock and 'expiresIn' (in seconds).
     * The 'id' can be any identifier to uniquely identify the lock within the system. At anytime, only one write lock with the same 'id' can be obtained.
     * The 'expiresIn' indicates the lock expiry time in seconds AFTER the lock is successfully obtained. Any further calls to 'obtainWriteLock'
     * will return undefined until either of the following conditions are met
     * 1. Lock is released: The given lock is explicitly released using the "releaseWriteLock" method OR
     * 2. Lock is expired: The 'expiresIn' number of seconds have passed since the lock was obtained.
     *
     * @returns write token or undefined if lock could not be obtained
     */
    obtainWriteLock(lockInfo: {
        id: string;
        expiresIn: number;
    }): Promise<string>;
    /**
     * Releases the write lock given the write token. The token is returned when you call "obtainWriteLock" or "tryWriteLock".
     * The token should be passed here to release the corresponding lock.
     *
     * @param {{writeToken: string}} lockReleaseInfo An object containing "writeToken".
     * @returns {Promise<void>}
     */
    releaseWriteLock(lockReleaseInfo: {
        writeToken: string;
    }): Promise<void>;
    /**
     * Attempts to obtain a lock given the number of attempts, with one second wait after each attempt (no backoff algorithm)
     *
     * @param {{id: string, expiresIn: number}} lockInfo Lock info with 'id' of the lock and 'expiresIn' (in seconds)
     * @param {{attemptsCount:number}} Attempts info with attemptsCount indicating maximum number of attempts to obtain the lock with one second wait after each attempt.
     * @returns {Promise<*>} write token or undefined if lock could not be obtained within the specified number of attempts
     */
    tryWriteLock(lockInfo: {
        id: string;
        expiresIn: number;
    }, { attemptsCount }?: {
        attemptsCount: number;
    }): Promise<any>;
    /**
     * Attempts to obtain a lock given the number of attempts, with one second wait after each attempt (no backoff algorithm)
     * and runs the specified function while holding the lock. Releases the lock after successful or failed (when the function throws any Error)
     * function excution.
     *
     * @param {{id: string, expiresIn: number}} lockInfo Lock info with 'id' of the lock and 'expiresIn'.
     * @param {function} fn The function to be executed while holding the obtained lock
     * @param {{attemptsCount: number}} options options obj with max 'attemptsCount'
     * @returns lock object or undefined if lock could not be obtained after the specified number of attempts
     */
    tryWriteLockAndRun({ id, expiresIn }: {
        id: string;
        expiresIn: number;
    }, fn: Function, { attemptsCount }?: {
        attemptsCount: number;
    }): Promise<any>;
}
