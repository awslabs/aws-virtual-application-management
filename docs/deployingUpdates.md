#Deploying Updates

Following an initial successful deployment, you can subsdequently deploy individually to the 5 serverless projects that are part of this solution.
Deploying Updates to the Web-Infra Serverless Project#

```
$ cd solution/web-infra
$ pnpx sls deploy -s <stage>
```

Deploying Updates to the Backend Serverless Project#

```
$ cd solution/backend
$ pnpx sls deploy -s <stage>
```

Deploying Updates to the Machine-Images Serverless Project#

```
$ cd solution/machine-images
$ pnpx sls deploy -s <stage>
```

Deploying Updates to the Post-Deployment Serverless Project#

```
$ cd solution/post-deployment
$ pnpx sls invoke local -f postDeployment --env WEBPACK_ON=true -s <stage>
```

Deploying Updates to the UI Serverless Project#

```
$ cd solution/ui
$ pnpx sls package-ui --stage <stage> --local
$ pnpx sls package-ui --stage <stage>
$ pnpx sls deploy-ui --stage <stage> --invalidate-cache
```
