---
id: trigger_workflow
title: Trigger Workflow
sidebar_label: Trigger Workflow
---

- Click the workflow to trigger
- To trigger the workflow manually
  - Click _Trigger_
  - Click _Datasets/Files_ to select the datasets, files and versions to be provided as input to the workflow
  - Click _Initial Payload_ to view the JSON object created by the previous step, and edit this if required
  - Click _Trigger_
- To trigger the workflow when an event occurs
  - Click _Event Triggers_
  - Enter an _Event Pattern_. For example, this listens for any S3 put object events with mime type `application/octet-stream` in dataset with id `OKzSxlzD67gPIRZ63GpFw`

    ```json
    {
      "detail-type": ["s3PutObject"],
      "detail": {
        "datasetId": ["OKzSxlzD67gPIRZ63GpFw"],
        "mimeType": ["application/octet-stream"]
      }
    }
    ```

  - Click _Create Event Trigger_
