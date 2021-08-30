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

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const _ = require('lodash');
const slugify = require('slugify');
const {
  utils: { run },
} = require('@aws-ee/api-testing-framework');

async function deleteImage({ aws, imageName = '' }) {
  // The cleanup logic is as follows
  // - ensure image contains the 'runId' to avoid accidental deletion
  // - stop the Step Functions State Machine execution if ongoing.
  // - delete the DDB record from AppstreamImages
  // - delete the actual image if it exists
  // - delete the associated workflow versions
  //   - get all versions from the workflow table
  //   - individually delete each version
  // - delete associated applications associated with this image from the S3 bucket
  const runId = aws.settings.get('runId');
  const bucket = `${aws.settings.get('globalNamespace')}-installer-work`;
  const stateMachine = `${aws.settings.get('namespace')}-workflow`;

  if (!imageName.includes(`-${runId}-`)) {
    console.log(
      `Image with name "${imageName}" does not contain the runId "${runId}", skipping deletion of this image.`,
    );
    return;
  }

  const db = await aws.services.dynamoDb();
  const image = await db.tables.appstreamImages
    .getter()
    .key({ id: imageName })
    .get();

  if (_.isEmpty(image)) {
    console.log(`Image with name "${imageName}" does not exist, skipping the deletion of this image.`);
  }

  // Delete the row from the appstreamImages table
  await run(async () =>
    db.tables.appstreamImages
      .deleter()
      .key({ id: imageName })
      .delete(),
  );

  // Stop step any existing workflow execution.
  const workflowId = slugify(_.kebabCase(_.startsWith(imageName, 'wf-') ? imageName : `wf-${imageName}`));
  const stepFunctions = await aws.services.stepFunctions();
  await stepFunctions.stopExecutionsForWorkflow(stateMachine, workflowId);

  // Delete the actual Image
  const appstream = await aws.services.appstream();
  const response = await appstream.deleteImage(imageName);
  if (response) {
    console.log(`DeleteImage returned: "${response}". Ignoring error and continuing.`);
  }

  // Delete all workflow versions
  // Get the workflow versions
  const versions = await db.tables.workflows
    .query()
    .key('id', workflowId)
    .limit(5000)
    .query();

  for (const version of versions) {
    await run(async () =>
      db.tables.workflows
        .deleter()
        .key({ id: version.id, ver: version.ver })
        .delete(),
    );
  }

  const s3 = await aws.services.s3();

  // Delete all applications associated with the image
  const applications = await s3.listObjects(bucket, `image_applications/${imageName}`);
  for (const application of applications) {
    await run(async () => s3.deleteObject(`s3://${bucket}/${application}`));
  }
}

module.exports = { deleteImage };
