---
id: configure_waf
title: Configure WAF
sidebar_label: Configure WAF
---

import useBaseUrl from '@docusaurus/useBaseUrl';

After the solution is deployed, an Amazon CloudFront distribution of the website is created.
By default, this distribution is protected by an AWS Web Application Firewall (WAF) configuration which prevents any public IP from accessing the website.

## Allow new IPs to access the website

One of the post-deployment steps that runs as part of a complete deployment, creates a parameter in AWS Systems Manager Parameter Store.

Open up a browser and log into your AWS Console. Navigate to AWS Systems Manager > Parameter Store.

You can find the configuration parameter by its name and path. It will be named `/<YOUR_STAGE_NAME>/<YOUR_SOLUTION_NAME>/cloud-front-waf-allow-list`.

Edit that parameter's value. You can see that it has a very restrictive configuration by default, `[{"Type": "IPV4", "Value": "127.0.0.1/32"}]`.
You can remove this value and substitute it with your own configuration.

Here is an example configuration that allows two IPv4 ranges:

```json
[
  {
    "Type": "IPV4",
    "Value": "192.168.0.123/32"
  },
  {
    "Type": "IPV4",
    "Value": "10.0.0.1/25"
  }
]
```

The configuration value uses CIDR notation. The solution will update WAF configuration based on the parameter value upon re-deployment of the solution or invocation of the post-deployment Lambda.
As such, after you have saved the new parameter value, either run the solution deployment script or invoke the post-deployment lambda.

To invoke the post-deployment Lambda, you can navigate to the Lambda service in the AWS Console and run a Test for the post-deployment Lambda with no parameters (i.e. { } on the payload) or you can use serverless from the host you used to deploy the solution by navigating into `main/.generated-solution/post-deployment` and then running `pnpx sls invoke -f postDeployment -s <STAGE>`.

After running the post-deployment Lambda there might be a slight delay of 1 minute before the changes are propagated through the AWS services.

To update the configuration, the post-deployment step uses the Javascript SDK. For more information about supported configuration values, refer to the [official documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/WAF.html#updateIPSet-property).

## Disable WAF (Not recommended)

You can disable WAF completely by overwriting the `useCloudFrontWaf` setting and setting it to `false`.
You can do this by editing the setting configuration file for your stage at `config/settings/${stage}.yml` and adding the line:

```yaml
useCloudFrontWaf: false
```
