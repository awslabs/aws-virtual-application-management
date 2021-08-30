---
id: quick_install
title: Installation Overview
sidebar_label: Installation Overview
---

Below are all the steps and commands involved in deploying the solution.
Refer to each section for more detail.

## Set up deployment instance

- 4+ GB RAM, Admin instance role

```{.sh}
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
source .bashrc
nvm install 12
```

See: [Deployment Instance](/deployment/pre_deployment/deployment_instance)

## Obtain and unzip source code

```{.sh}
curl -o <project_name>.zip <provided_url>
unzip <project_name>.zip
```

See: [Source Code](/deployment/pre_deployment/source_code)

## Run the main deployment

- `pnpm install -r`
- `pnpx sls solution-assemble -s <stage>`
- `pnpx sls solution-deploy -s <stage>`

See: [Deploying The Solution](/deployment/deployment/index)

## Post deployment

See: [Post Deployment](/deployment/post_deployment/index)
