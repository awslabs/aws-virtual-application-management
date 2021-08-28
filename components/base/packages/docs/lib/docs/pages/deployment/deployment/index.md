---
id: index
title: Deployment
sidebar_label: Deployment
---

## Install and assemble the solution

Navigate to the solution folder using the command line.

- Run `pnpm install -r`
- Run `pnpx sls solution-assemble -s <stage>`

## Run main deployment script

- Run `pnpx sls solution-deploy -s <stage>`

- Under normal circumstances it takes 5-20 minutes

- After the deployment has successfully finished, take a note of its
  CloudFront URL.

  > **Note:** This information can be retrieved later by running
  >   `pnpx sls solution-info -s <stage>`

- You can now log in to your deployment by accessing the link above
  and using one of the email addresses specified in the `adminPrincipals`
  config setting.

  > **Note:** A temporary password should have been sent to this address when the
  > [Post Deployment](/deployment/post_deployment/index) step ran.)
