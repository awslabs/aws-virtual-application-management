# Post-Deployment

## Deploy the post-deployment AWS Lambda function

All the commands mentioned below need to be executed from the `main/.generated-solution/post-deployment` directory

```bash
$ pnpx sls deploy -s <stage>
```

## To run post-deployment steps

```bash
$ pnpx sls invoke -f postDeployment -s <stage>
```

## To run post-deployment steps locally (for testing)

```bash
$ pnpx sls invoke local -f postDeployment -s <stage>
```

## Overview of Lambda Functions

We customize each deployment using a Lambda function. This function runs a list of deployment steps.

- Post-deployment Lambda

  There are certain actions that need to take place after the solution is deployed. This Lambda function provides extension points for other components to perform such actions. 
  These actions could include things like populating some data, provisioning some resources not supported by AWS CloudFormation etc
