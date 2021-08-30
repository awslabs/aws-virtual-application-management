# serverless-sync-to-s3

This package is a Serverless plugin that will sync local files to S3. This plugin is compatible
with buckets that have objects encrypted with KMS.

### Prerequisites

#### Tools

- Node 12

## Configuration

This Serverless plugin expects to have custom configuration in the serverless.yml as in the following
example:

```
custom:
  s3Sync:
    - bucketName: <bucket name>
      bucketPrefix: <bucket prefix>
      localDir: <local directory>
```
