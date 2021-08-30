---
id: summary
title: Summary
sidebar_label: Summary
---

This solution has been designed from the ground up to be easy to install and get running quickly. To deploy this solution the Serverless Framework is used.

The solution contains serverless projects assembled through scripts also called deployable units. The most significant ones are:

| Serverless Project                          | Description                                                                                                            |
| :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| main/.generated-solution/backend/           | Code for the Backend API and Services.                                                                                 |
| main/.generated-solution/web-infra/         | Code for the creation of the Web AWS Infrastructure required for the UI.                                               |
| main/.generated-solution/edge-lambda/       | Code for the creation of the Lambda@Edge that manages HTTP security headers and redirects for the UI distribution.     |
| main/.generated-solution/eventbridge-infra/ | Code the the creation of the infrastructure required for event publishing and subscribing.                             |
| main/.generated-solution/post-deployment/   | Code that executes upon the completion of the deployment of the solution to seed databases and configure some options. |
| main/.generated-solution/ui/                | Code the the web-based user interface.                                                                                 |
| main/.generated-solution/docs/              | Code the the web-based documentation.                                                                                  |

These are the main deployable units that power the solution. You may find that there are additional deployable units not listed here but have specific
functionality that is documented in the respective README.md file found inside each folder.

An installation can be run from your laptop or an EC2 instance
and involves the following stages that will be described in detail in this section of the documentation and its sub-sections:

- If deploying from EC2, create an instance with an appropriate
  instance profile
- Installing Node and some Node-based software on your local machine
  or EC2 instance
- Downloading and unpacking the solution code
- Choosing a stage name
- Optionally editing a configuration file
- Running the main deployment script
- Log in and create local user accounts
