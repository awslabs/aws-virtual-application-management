# CI/CD Pipeline

- [Terms](#terms)
- [How does the pipeline work](#how-does-the-pipeline-work)
  - [Build Pipeline](#build-pipeline)
    - [Source](#source)
    - [Components](#components)
    - [Build](#build)
    - [Deploy-To-Staging](#deploy-to-staging)
    - [Test-Staging-Env](#test-staging-env)
    - [Push-To-Target-Env](#push-to-target-env)
    - [Deploy-To-Target](#deploy-to-target)
    - [Test-Target-Env](#test-target-env)
- [How to deploy the CI/CD Pipeline](#how-to-deploy-the-cicd-pipeline)
  - [Automated deployment](#automated-deployment)
  - [Manual deployment](#manual-deployment)

---

## Terms

**Source Account:** AWS Account containing CodeCommit repository with the source code. The CodePipeline is deployed in the source account.

**Target Account:** AWS Account where the solution needs to be deployed to.

**Staging Environment:** Solution environment created to run integration tests or manual tests before deploying the solution to final target environment.

**Target Environment:** Target solution environment that is used to deploy the solution to the target AWS account.

## How does the pipeline work

At high level the pipeline works as follows:

1. Every commit in the source account on the configured repository for the specified branch triggers a CloudWatch event
2. A CloudWatch Rule triggers the CodePipeline as mentioned in the **Build Pipeline** section below
3. The pipeline contains the build & deployment stages and executes them. The pipeline stops upon failure of any stage and notifies user via configured SNS topic.

### Build Pipeline

#### Source

This stage takes the code from the source account CodeCommit repository and uploads it to the pipeline artifacts bucket in the source account.

#### Components

This stage uses the raw source code artifact from the **Source** stage, initializes the components (which are stored as GIT submodules) and downloads the environment config from Amazon S3.

#### Build

This stage uses [AWS CodeBuild](https://aws.amazon.com/codebuild/) to perform the build process. It downloads the code from the artifacts S3 bucket and installs dependencies, performs the static code analysis, and it runs the unit tests.

#### Deploy-To-Staging

This stage uses [AWS CodeBuild](https://aws.amazon.com/codebuild/) to downloads the artifact built in the previous stage (**Build**) and deploys it to the staging environment.

It uses the artifact created in the **Build** stage and deploys it to the staging environment. This stage is optional and it's controlled by the boolean `createStagingEnv` configuration parameter.

This stage is only created if `createStagingEnv` setting is set to `true` in settings file. Developers can set `createStagingEnv` to `false` to skip creation and deployment to staging environment and directly push changes to their target development environment. This flag should be set to `true` for higher environments (such as `demo` or `production`) to make sure code is deployed and tested in a staging environment before pushing to target environment.

```yaml
# main/config/settings/cicd-pipeline/<env-name>.yml
createStagingEnv: true
```

#### Test-Staging-Env

This stage uses [AWS CodeBuild](https://aws.amazon.com/codebuild/) to execute integration
tests against the staging environment.

This stage is only created if `createStagingEnv` setting is set to `true` in settings file. Developers can set `createStagingEnv` to `false` to skip creation and deployment to staging environment and directly push changes to their target development environment.

#### Push-To-Target-Env

This stage is for manual approval to deploy to target environment. The pipeline will pause at this stage and wait for manual approval.

The user will receive an email notification via configured SNS topic. The notification email address is configured via the setting `emailForNotifications` in the settings file.

This stage is only created if `requireManualApproval` setting is set to `true` in settings file. Setting `requireManualApproval` to `false` will cause auto-propagation to the target environment.

```yaml
# main/config/settings/cicd-pipeline/<env-name>.yml
requireManualApproval: true
```

#### Deploy-To-Target

This stage uses [AWS CodeBuild](https://aws.amazon.com/codebuild/) to download the artifact created in the **Build** stage from the artifacts S3 bucket and then deploy it to the target environment.

#### Test-Target-Env

This stage uses [AWS CodeBuild](https://aws.amazon.com/codebuild/) to execute integration tests against the target environment.

This stage is only created if `runTestsAgainstTargetEnv` setting is set to `true` in settings file. Developers can set `createStagingEnv` to `false`, `requireManualApproval` to `false`, and `runTestsAgainstTargetEnv` to `true` to skip creation and deployment to staging environment and directly push changes to their target development environment without requiring manual approval and run integration tests directly against their target development environment.

## How to deploy the CI/CD Pipeline

### Automated deployment

1. Create a settings file in `main/config/settings/cicd-target/` for the environment for which you want to create the CI/CD pipeline. For example, to create the CI/CD target component for a `dev` environment, create `dev.yml` file in `main/config/settings/cicd-target/`. You can create the settings file by copying the sample `example-codecommit.yml` file.

   Please adjust the settings as per your environment. Read inline comments in the file for information about each setting.

   You don't need to adjust the following settings:

     ```yaml
     sourceAccountAppPipelineRole: ''
     ```

2. Create a settings file in `main/config/settings/cicd-pipeline/` for the environment for which you want to create the CI/CD pipeline. For example, to create the CI/CD pipeline for `dev` environment, create `dev.yml` file in `main/config/settings/cicd-pipeline/`. You can create the settings file by copying the sample `example-codecommit.yml` file.

   Please adjust the settings as per your environment. Read inline comments in the file for information about each setting.

   You don't need to adjust the following settings:

     ```yaml
     targetAccountAppDeployerRoleArn: ''
     ```

3. Execute the below command in your terminal at the root of the solution:

```bash
pnpx sls solution-cicd-deploy -s <env-name>
```

### Manual deployment

1. Deploy `cicd-target` stack to the Target Account

    - Create a settings file in `main/config/settings/cicd-target` for the environment for which you want to create the CI/CD target. For example, to create the CI/CD target component for a `dev` environment, create `dev.yml` file in `main/config/settings/cicd-target/`. You can create the settings file by copying the sample `example-codecommit.yml` file.

      Please adjust the settings as per your environment. Read inline comments in the file for information about each setting.

      Set the following settings as `"<source-account-aws-number>"`

      ```yaml
      # Set this as AWS Account ID of the source account where the AWS Code Commit containing the source code exists
      sourceAccountAppPipelineRole: "<source-account-aws-number>"
      ```

    - Deploy the CI/CD target component by executing the below command in your terminal

      ```bash
      pnpx sls solution-cicd-target-deploy -s <env-name>
      ```

2. Deploy `cicd-pipeline` stack to the Source Account

    - Note down the CloudFormation stack output variable `AppDeployerRoleArn` from the `cicd-target` stack you deployed in step 1 above.

      You can use `sls info` command with `--verbose` flag to print stack output variables as follows.

      ```bash
      cd main/.generated-solution/cicd/cicd-target
      pnpx sls info --verbose -s <env-name>
      ```

    - Create a settings file in `main/config/settings/cicd-pipeline/` for the environment for which you want to create the CI/CD pipeline. For example, to create the CI/CD pipeline for `dev` environment, create `dev.yml` file in `main/config/settings/cicd-pipeline/`. You can create the settings file by copying the sample `example-codecommit.yml` file.

      Please adjust the settings as per your environment. Read inline comments in the file for information about each setting.

    - Deploy the `cicd-pipeline` stack.

      ```bash
      pnpx sls solution-cicd-pipeline-deploy -s <env-name>
      ```

3. Re-deploy `cicd-target` stack to the Target Account to lock down permissions.

    - Note down the CloudFormation stack output variable `AppPipelineRoleArn` from the
      `cicd-pipeline` stack you deployed in step 2 above.

      You can use `sls info` command with `--verbose` flag to print stack output variables as follows.

      ```bash
      cd main/.generated-solution/cicd/cicd-pipeline
      pnpx sls info --verbose -s <env-name>
      ```

    - Set the CloudFormation stack output variables `AppPipelineRoleArn` that you obtained above in the setting `sourceAccountAppPipelineRole` in your environment settings file `main/config/settings/cicd-target/<env-name>.yml` then re-deploy the `cicd-target` stack to lock down the permissions.

      ```yaml
      sourceAccountAppPipelineRole: '<value of the CloudFormation output variable AppPipelineRoleArn from the cicd-pipeline stack>'
      ```

    - Deploy the `cicd-pipeline` stack.

      ```bash
      pnpx sls solution-cicd-target-deploy -s <env-name>
      ```
