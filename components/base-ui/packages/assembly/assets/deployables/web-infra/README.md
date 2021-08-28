# Website Infrastructure
To deploy website infrastructure for static website hosting using Amazon S3 and Amazon CloudFront distribution.

## Packaging and deploying

All the commands mentioned below need to be executed from the `main/solution/web-infra` directory

To package cfn without deploying it

```bash
$ pnpx sls package --stage <stage name>
```

To deploy:

```bash
$ pnpx sls deploy --stage <stage name>
```
This can take a while (roughly 15 to 20 minutes) if you are deploying this for the first time or 
if you are re-deploying with some changes to the CloudFront distribution.

## Useful commands

To list all resolved variables:

```bash
$ pnpx sls print --stage <stage name>
```

To view AWS CloudFormation Stack outputs (only works after deploy)
```bash
$ pnpx sls info --verbose --stage <stage name>
```
