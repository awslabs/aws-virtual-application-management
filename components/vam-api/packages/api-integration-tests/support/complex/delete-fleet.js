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

/* eslint-disable no-console */

async function deleteFleet({ aws, fleetName = '' }) {
  // The cleanup logic is as follows
  // - ensure the fleet contains the 'runId' to avoid accidental deletion.
  // - disasocciate the fleet from its stack.
  // - delete the fleet.
  // - delete the stack.
  // - revoke group access for the fleet.
  // - delete dynamic catalogs

  const runId = aws.settings.get('runId');

  if (!fleetName.includes(`-${runId}-`)) {
    console.log(
      `Fleet with name "${fleetName}" does not contain the runId "${runId}", skipping deletion of this fleet.`,
    );
    return;
  }

  const appstream = await aws.services.appstream();

  await appstream.stopFleet(fleetName);

  // Disassociate the fleet from its stack.
  let response = await appstream.disassociateFleet(fleetName);
  if (response) {
    console.log(`DisassociateFleet returned: "${response}". Ignoring error and continuing.`);
  }

  // Delete the fleet.
  response = await appstream.deleteFleet(fleetName);
  if (response) {
    console.log(`DeleteFleet returned: "${response}". Ignoring error and continuing.`);
  }

  // Delete the stack.
  response = await appstream.deleteStack(fleetName);
  if (response) {
    console.log(`DeleteStack returned: "${response}". Ignoring error and continuing.`);
  }

  // TODO: Revoke group access.
  // TODO: Delete dynamic catalogs.
}

module.exports = { deleteFleet };
