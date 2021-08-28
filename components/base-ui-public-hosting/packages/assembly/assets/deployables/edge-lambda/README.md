# Lambda@Edge

This component deploys a Lambda@Edge function that intercepts website Amazon CloudFront `origin-response` and adds various
security related HTTP headers in the response before serving the website content from S3.

## Packaging and deploying

All the commands mentioned below need to be executed from the `main/solution/edge-lambda` directory

To package cfn without deploying it

```bash
$ pnpx sls package --stage <stage name>
```

To deploy:

```bash
$ pnpx sls deploy --stage <stage name>
```

This can take a while (roughly 5 to 15 minutes) if you are deploying this for the first time or
if you are re-deploying with some changes to the Lambda@Edge function.

## Useful commands

To list all resolved variables:

```bash
$ pnpx sls print --stage <stage name>
```

To view AWS CloudFormation Stack outputs (only works after deploy)

```bash
$ pnpx sls info --verbose --stage <stage name>
```
