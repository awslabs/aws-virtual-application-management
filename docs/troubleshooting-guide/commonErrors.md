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

**Q: Do we need to script moving from s3 to a tmp directory for the installation of new applications? **

Yes.

**Q: How do we use Dynamic Catalog?**

In order to use Dynamic Catalog the streaming instances are required to be domain joined, which can be set with AdJoined = true in the CloudFormation template. If you just want to test the auth piece, create an image builder without Dynamic Catalog.

**Q: I get this error: "Directory config already exists. Provide a unique directory name within an AWS region." How to resolve? **

Solution: Delete existing directory config or 

* Template error (AD Connector): Fn::Select cannot select nonexistent value at index 1.....Error while executing command: node ./scripts/environment-deploy.js "$ENV_TYPE"
    * Solution: Use 2 IP addresses as parameters to CloudFormation stack under DnsIpAddresses
* DOMAIN_JOIN_ERROR_NO_SUCH_DOMAIN for imagebuilder instances
    * Your AD connector domain controller SG needs to allow inbound from (demo-va-claas-image-builder-ImageBuilderSecurityGroup-####) see pic for example:
    * [Image: image.png]

* CloudFormation Error: “1 validation error detected: Value at 'pipeline.stages.1.member.actions.1.member.configuration' failed to satisfy constraint: Map value must satisfy constraint: [Member must have length less than or equal to 1000, Member must have length greater than or equal to 1] (Service: AWSCodePipeline; Status Code: 400; Error Code: ValidationException; Request ID: 6f64ebef-eac4-43b3-8969-f284019946df; Proxy: null)”
    * Check that all required parameters in CloudFormation stack are filled out

## Solution Errors

Post-Install:

* Ran into Image Limit and there was no error in VAM Dashboard
    * I found the error in the SSM Command
        * {
            "status": 1,
            "message": "You've reached the limit for images. Before you create a new image, you must delete at least one image or request a limit increase"
            }
            --- output ---
* When a Workflow fails it stays hung and the id cannot be reused
* If deletion of an image fails it gets removed from Dynamo still (e.g. Image is in use)

NCSU Customer Feedback

* Multiple versions of applications - Nesting versions  under the parent folder shows multiple applications, but not able to  distinguish between them. As we create a folder with the version it  would be nice to be able to have multiple versions nested in this  fashion. 
* Cleaning up broken workflows - Not able to delete or clean up failed workflows
* VAM interface page times out before the request to  extend the session is offered.
* Large application installs fail due to timeout. Many of  the applications we deploy are larger than 15gb and consist of 20k+ files (Matlab).  The install times out even before the copy from S3 finishes. To resolve  this issue I have zipped the contents and within the install script added  a line to extract the contents before installation. This greatly reduces  the time for the source transfer. This works well for some applications  (this would be my preferred method just to decrease the overall build  time), but as a feature request it would be nice to have an option/way to  change that timeout or extend that timeout for applications that take an  extended period of time to install which may cause a timeout issue.  Perhaps an option "Larger Application" which would double that  timeout.

8/24

* Install Powershell script - how to pass runtime parameters
    * https://docs.aws.amazon.com/appstream2/latest/developerguide/programmatically-create-image.html
    * Add Launch Parameters and Working Directory
        * Required for COMSOL application
* It is best to zip files before transferring to S3



