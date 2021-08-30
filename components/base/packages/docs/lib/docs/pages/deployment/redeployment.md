---
id: redeployment
title: Deploying Updates
sidebar_label: Deploying Updates
---

Following an initial successful deployment, you can subsequently deploy individually to the 5 serverless projects that are part of this solution.

## Deploying Updates to the Web Infrastructure Serverless Project

```bash
$ cd main/.generated-solution/web-infra
$ pnpx sls deploy -s <stage>
```

## Deploying Updates to the Backend Serverless Project

```bash
$ cd main/.generated-solution/backend
$ pnpx sls deploy -s <stage>
```

## Deploying Updates to the Post-Deployment Serverless Project

```bash
$ cd main/.generated-solution/post-deployment
$ pnpx sls invoke local -f postDeployment --env WEBPACK_ON=true -s <stage>
```

## Deploying Updates to the UI Serverless Project

```bash
$ cd main/.generated-solution//ui
$ pnpx sls package-ui --stage <stage> --local=true
$ pnpx sls package-ui --stage <stage>
$ pnpx sls deploy-ui --stage <stage> --invalidate-cache
```

## Deploying Updates to the Docs Serverless Project

```bash
$ cd main/.generated-solution/docs
$ pnpx sls package-ui --stage <stage> --local=true
$ pnpx sls package-ui --stage <stage>
$ pnpx sls deploy-ui-s3 --stage <stage> --invalidate-cache
```
