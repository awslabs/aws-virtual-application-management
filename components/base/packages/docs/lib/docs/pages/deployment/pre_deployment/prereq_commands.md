---
id: prereq_commands
title: Prerequisite Software
sidebar_label: Prerequisite Software
---

## Required Tools

Before you can build this solution, you need the following tools installed:

- Node.js (12.14.x or later) (<https://nodejs.org/>)
- AWS Command Line Interface (<https://aws.amazon.com/cli/>)
- PNPM (<https://pnpm.js.org/>)
- cfn-lint (<https://github.com/aws-cloudformation/cfn-python-lint>)

  Install the most commonly used prerequisites the following way:

```{.sh}
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
source .bashrc
nvm install 12
```

## Installing AWS Command Line Interface

If you're running on an EC2 instance configured with Alinux2 AMI, you alredy have aws command line interface.

Otherwise, follow [https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) to install it.

## Installing PNPM

Execute the following command to install PNPM on the machine you will be using to deploy the solution from:

```bash
$ npm install -g pnpm
```

## Installing cfn-lint

`cfn-lint` is a tool that is used as part of the deployment to validate the CloudFormation template code used in the solution.

To be able to deploy the solution, please follow the [installation instructions on the official website](https://github.com/aws-cloudformation/cfn-python-lint).

## AWS Account & Access

You will need to create a new AWS account or have an existing AWS account to deploy this solution into.

With that account you will also need to create an IAM user and set up a named profile on your development machine with the appropriate access keys and permissions to deploy resources in to the account. The credentials should be saved in ‘~/.aws/credentials’, as this is where the framework will look in order to deploy.

:::tip
For more information on how to configure AWS CLI profiles see [https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html).
:::
