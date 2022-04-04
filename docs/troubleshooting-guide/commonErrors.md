# Troubleshoooting guide

## Deployment Errors

### Identifying errors

When launching deploying the solution, be aware that misconfigurations in the CloudFormation parameters and/or AWS Account could cause the deployment to fail. To assist in troubleshooting, ensure that you review both AWS CodePipeline logs and AWS CloudFormation deployment events while it is being deployed. AWS CodePipeline logs provide the most detail into errors you may be running into. However, if an error is not caught in the CodePipeline logs, it is likely that the CloudFormation deployment events includes the information that you need. Keep in mind that if the deployment template runs into an error, it will initiate a ROLLBACK event for the specific CloudFormation template and you will be unable to identify the error once the template is deleted. 

### Deployment Troubleshooting Guide

**Q: I launched the deployment and was watching the AWS CodePipeline logs. One of the AWS CloudFormation templates began rolling back, but I did not notice an error. I looked to review the AWS CloudFormation deployment events, but the template was already deleted. How should I proceed?**

In this case, it is likely you will need to relaunch the solution and keep a closer look at the AWS CloudFormation deployment events to identify the root cause of your error. Refresh the page periodically. However, in most cases deployments fail due to hitting AWS service limits for S3, API Gateway, NAT Gateways, EIP, CloudFront, Managed Active Directory, AppStream Image Builders or any combination of the services. Review your current quotas and adjust accordingly.

**Q: How do we get the password from the pipeline build?**

See Systems Manager -> Parameter Store. Alternatively, check the CodeBuild output - at the end will be the output of getInfo. The password line will say something like execute aws ssm ... - the command after execute can be cut/pasted into a cli to retrieve the password.

**Q: I hit a manual step in CodePipeline and now everything is gone. What happened?**

If you set demo deployment to true and trigger the deletion step in CodePipeline, it will delete everything.

**Q: Do we need to script moving from s3 to a tmp directory for the installation of new applications?**

Yes.

**Q: How do we use Dynamic Catalog?**

In order to use Dynamic Catalog the streaming instances are required to be domain joined, which can be set with AdJoined = true in the CloudFormation template. If you just want to test the auth piece, create an image builder without Dynamic Catalog.

**Q: I get this error: "Directory config already exists. Provide a unique directory name within an AWS region." How to resolve?**

Delete existing directory config or configure through the CloudFormation template parameters.

**Q: I get this error: "Template error (AD Connector): Fn::Select cannot select nonexistent value at index 1.....Error while executing command: node ./scripts/environment-deploy.js "$ENV_TYPE" ." How to resolve?**

Use 2 IP addresses as parameters to CloudFormation stack under DnsIpAddresses.

**Q: I get this error: "DOMAIN_JOIN_ERROR_NO_SUCH_DOMAIN for imagebuilder instances." How to resolve?

Your AD connector domain controller SG needs to allow inbound from (demo-va-claas-image-builder-ImageBuilderSecurityGroup-####) see pic for example:

![AD SecurityGroup](/ImageErrorADSecurityGroup.png)

**Q: I get this error in CloudFormation: “1 validation error detected: Value at 'pipeline.stages.1.member.actions.1.member.configuration' failed to satisfy constraint: Map value must satisfy constraint: [Member must have length less than or equal to 1000, Member must have length greater than or equal to 1] (Service: AWSCodePipeline; Status Code: 400; Error Code: ValidationException; Request ID: 6f64ebef-eac4-43b3-8969-f284019946df; Proxy: null).” How to resolve?"

Check that all required parameters in CloudFormation stack are filled out.

## Solution Errors

### Identifying errors

Most errors will appear while creating AppStream Images and Fleets. When creating AppStream Images, you will find detailed error messages within Workflows. To review the errors, navigate to the Workflows, choose the appropriate image, and click on the red Error button. Depending on the step and type of error message, you should be able to to determine additional troubleshooting mechanisms. For example, if you run into issues when when launching an applicaion, in additional to the Workflow errors you can review the AppStream 2.0 Image Builder logs by logging into the image builder through the AWS Console. When in doubt, feel free to contact your AWS Solutions Architect for additional guidance.

### Deployment Troubleshooting Guide

**Q: I ran into this error: "You've reached the limit for images. Before you create a new image, you must delete at least one image or request a limit increase." How to resolve?

You have run into the AWS service limit for the specific image. Either choose a different image within your AWS service limits or increase the service limit for that particular image through the AWS console.

**Q: I ran into this error: "NetworkError when attempting to fetch resource." How to resolve?

Your session has timed. Refresh the page and log back into the solution using your credentials.

**Q: I ran into this error: "A 'wait' decision with its check function commandFinished() reached its maximum number of attempts '30'." How to resolve?

Unfortunately, this is a generic error that something failed while preparing the Image Builder Environment. Check to ensure that your Active Directory security groups have not been modified and that it is still able to run PowerShell scripts on the instance. If you are unable to resolve this error, contact your AWS Solutions Architect for additional guidance.

**Q I have large applications that are failing to install due to timeout (Matlab). The install times out even before the copy from S3 finishes. How to resolve? 

Zip the contents and within the install script added a line to extract the contents before installation. This greatly reduces the time for the source transfer. 
