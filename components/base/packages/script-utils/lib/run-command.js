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

import path from 'path';
import _ from 'lodash';
import chalk from 'chalk';
import spawn from 'cross-spawn';

/**
 * Spawns a new child process.
 *
 * The stdin, stdio, and stderr streams from the parent process will be shared with the child process.
 * You should not use this method if you need to inspect or wrap the output of the child process. Instead,
 * consider using {@link external:runPipedCommand}.
 *
 * @param {string} command The command to run.
 * @param {string[]} args List of string arguments.
 * @param {number[]} successCodes List of success codes. If the subprocess exits with any of these codes,
 * it will be considered to have succeeded. Otherwise, a ChildProcessError will be thrown.
 * @param {string} cwd Current working directory of the child process.
 * @param {Object} env Environment variable key-value pairs.
 * @param {function} printCommandFn Optional function, which if provided will be used to print information
 * about the command that is executed. Expected format is (msg: string) => void.
 *
   @throws {Error} If child process could not be started.
   @throws {ChildProcessError} If child process errored (returns exit code not defined in {@link successCodes}.
 * @returns {Promise<*>}
 */
const runCommand = ({ command, args, successCodes = [0], cwd = process.cwd(), env, printCommandFn = () => {} }) => {
  const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, ...env }, cwd });
  printCommandFn(`${chalk.cyan(`(${path.resolve(cwd)})`)} ${chalk.green('>>')} ${command} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    // We are using _.once() because the error and exit events might be fired one after the other
    // (see https://nodejs.org/api/child_process.html#child_process_event_error)
    const rejectOnce = _.once(reject);
    const resolveOnce = _.once(resolve);

    child.on('error', () => callLater(rejectOnce, new Error('Failed to start child process.')));
    child.on('exit', code => {
      if (successCodes.includes(code)) {
        callLater(resolveOnce);
      } else {
        callLater(rejectOnce, new ChildProcessError(code));
      }
    });
  });
};

/**
 * Spawns a new child process.
 *
 * The stdin, stdio, and stderr streams from the parent process will be shared with the child process.
 * You should not use this method if you need to inspect or wrap the output of the child process. Instead,
 * consider using {@link external:runPipedCommand}.
 *
 * @param {string} command The command to run.
 * @param {string[]} args List of string arguments.
 * @param {number[]} successCodes List of success codes. If the subprocess exits with any of these codes,
 * it will be considered to have succeeded. Otherwise, a ChildProcessError will be thrown.
 * @param {string} cwd Current working directory of the child process.
 * @param {Object} env Environment variable key-value pairs.
 * @param {function} printCommandFn Optional function, which if provided will be used to print information.
 * about the command that is executed. Expected format is (msg: string) => void.
 * @param {function} stdoutFn Optional function to write stdout from the child process to. Expected format is (msg: string) => void.
 * @param {function} stderrFn Optional function to write stdout from the child process to. Expected format is (msg: string) => void.
 * @param {RegExp[]} stdoutErrPatterns If any these RegExp patterns match a line of stdout, then the line containing the pattern will be the ChildProcessError message if a non-success exit code is returned.
 * @param {RegExp[]} stderrErrPatterns If any these RegExp patterns match a line of stdout, then the line containing the pattern will be the ChildProcessError message if a non-success exit code is returned.
 *
   @throws {Error} If child process could not be started.
   @throws {ChildProcessError} If child process errored (returns exit code not defined in {@link successCodes}.
 * @returns {Promise<*>}
 */
const runPipedCommand = ({
  command,
  args,
  successCodes = [0],
  cwd = process.cwd(),
  env,
  printCommandFn = () => {},
  stdoutFn = () => {},
  stderrFn = () => {},
  stdoutErrPatterns,
  stderrErrPatterns,
}) => {
  const child = spawn(command, args, { stdio: 'pipe', env: { FORCE_COLOR: true, ...process.env, ...env }, cwd });
  printCommandFn(`${chalk.cyan(`(${path.resolve(cwd)})`)} ${chalk.green('>>')} ${command} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    // We are using _.once() because the error and exit events might be fired one after the other
    // (see https://nodejs.org/api/child_process.html#child_process_event_error)
    const rejectOnce = _.once(reject);
    const resolveOnce = _.once(resolve);
    const errorMessages = [];

    child.stdout.on('data', data => {
      const stdoutLine = data.toString().trim();
      stdoutFn(stdoutLine);

      // Some commands output an error to stdout instead of stderr.
      // If any of these RegExp patterns match a line of stdout, then
      // the line containing the pattern will be added to the ChildProcessError
      // error messages if a non-success exit code is returned.
      if (stdoutErrPatterns) {
        stdoutErrPatterns.forEach(stdoutErrPattern => {
          if (stdoutErrPattern.test(data)) {
            errorMessages.push(stdoutLine);
          }
        });
      }
    });
    child.stderr.on('data', data => {
      const stderrLine = data.toString().trim();
      stderrFn(stderrLine);

      if (stderrErrPatterns) {
        stderrErrPatterns.forEach(stderrErrPattern => {
          if (stderrErrPattern.test(data)) {
            errorMessages.push(stderrLine);
          }
        });
      } else {
        // Assume all lines of stderr relate to an error message if
        // not explicitly specified via `stderrErrPatterns`.
        errorMessages.push(stderrLine);
      }
    });

    child.on('error', () => callLater(rejectOnce, new Error('Failed to start child process.')));

    child.on('exit', exitCode => {
      if (successCodes.includes(exitCode)) {
        callLater(resolveOnce);
      } else {
        callLater(rejectOnce, new ChildProcessError(exitCode, errorMessages));
      }
    });
  });
};

class ChildProcessError extends Error {
  constructor(exitCode, errorMessages = []) {
    super();
    this.name = 'ChildProcessError';
    this.errorMessages = errorMessages;
    this.message = errorMessages.join('\n');
    this.exitCode = exitCode;
  }
}

// To help avoid unleashing Zalgo (see http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)
const callLater = (callback, ...args) => {
  setImmediate(() => {
    callback(...args);
  });
};

export { runCommand, runPipedCommand, ChildProcessError };
