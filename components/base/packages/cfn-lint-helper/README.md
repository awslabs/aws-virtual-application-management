# @aws-ee/base-cfn-lint-helper

This package provides default deployment-time cfn-lint behavior on generated cloud formation templates using the AWS provided cfn-lint python package.
The consumer needs to ensure the package is preinstalled in the deployment environment.

You can install cfn-lint by using the installation instructions from the [official repository](https://github.com/aws-cloudformation/cfn-python-lint).

If you have Python3 installed and using `pip`, you can install it using the following command:

```bash
$ pip3 install cfn-lint
```

Or if you're using Mac OS:

```bash
$ brew install cfn-lint
```

## To use this plugin

1. Import it in your project

```bash
$ pnpm add @aws-ee/base-cfn-lint-helper --save-dev
```

2. Declare it in plugins section of serverless.yml

```yaml
---
plugins: ...
  - '@aws-ee/base-cfn-lint-helper'
  ...
```

## Functionality

When included as a plugin in the `serverless.yml` file, generated templates will be checked for common errors and warnings before being uploaded to AWS when the deployment script runs.
Warnings will be printed, but ignored. Deployment will break on errors.
To ignore the errors highlighted by the `cfn-lint` tool and to continue with the deployment, use the `--cfn-lint-warn-only` argument to the deployment script.
This argument can be specified when deploying the entire solution, e.g. `pnpx sls solution-deploy -s <STAGE_NAME> --cfn-lint-warn-only`, or at an individual deployable unit level.
To ignore the errors for an individual deployable unit, navigate to the deployable unit folder under `.generated-solution` and run `pnpx sls deploy -s <STAGE_NAME> --cfn-lint-warn-only`.
