# Deploying the VAM Solution

You can deploy VAM using either of the following methods:
  * [Using AWS CloudFormation template](#using-an-aws-cloudformation-template)
  * [Using a pre-existing VPC and subnets](#deploy-using-a-pre-existing-vpc-and-subnets)
  * [Using pre-existing VPCs, subnets, and Active Directory](#deploy-using-a-pre-existing-vpc-subnets-and-active-directory)

Using a pre-existing VPC and/or AD is a more advanced option. VAM requires a VPC, subnets, AD with certain configurations.
These will be automatically created, along with many other implicit pieces of infrastructure required to support them.
If a pre-existing VPC or AD is needed, such as when situating VAM fleets within a specific network,
then overriding certain configuration values will disable creation of this implicit infrastructure and
the external infrastructure will be used instead.

## Using an AWS CloudFormation template

The VAM solution can be deployed using a CloudFormation template. From the template, AWS CloudFormation will
create a new CloudFormation stack that handles deployment. Using this method the zip containing
the code is stored in a versioned S3 bucket. A CodePipeline pipeline is then used to deploy the
solution. A benefit of this method is that updated zip files are automatically deployed using
the same configuration.

### Step 1: Verify the zip archive
Download the ZIP archive for the solution. A SHA 256 hash should exist to verify the archive is the one expected. If you do not have the checksum, feel free to continue to Step 2 after unzipping the archive.

* Unzip the archive.
* Execute the following relative to the root of the unzipped archive:

`components/vam-silky-smooth-deployments/packages/deployment-pipeline/scripts/verify-zip.sh <path to zip archvie> <expected SHA 256 checksum>`

* The script should exit with code `0` and the output should end with "`It is ok to proceed.`" If the output ends with "`Please report this to the provider of this package.`", it is highly recommended to *STOP* and do so.

### Step 2: Creating the S3 bucket

* Create an S3 bucket with versioning enabled. This is required by CodePipeline.
* Zip the contents of the archive, as including the "aws-virtual-application-management" top level folder will cause the CodePipeline to fail. Upload the VAM solution zip to this bucket.

> **Note:** create the S3 bucket in the same region where VAM will ultimately be deployed. For example,
if VAM should primarily run in us-west-2 for cost purposes, then the S3 bucket should live there also.

### Step 3: Creating a CloudFormation stack

Create a CloudFormation stack using the CLI or console. The CloudFormation template used to create
the stack can be found in the zip file (`components/vam-silky-smooth-deployments/packages/deployment-pipeline/config/buildspec/cloudformation.yml`).

* Open [https://console.aws.amazon.com/cloudformation/home#/stacks/create/template](https://console.aws.amazon.com/cloudformation/home#/stacks/create/template) in a web browser (and login to the appropriate account if needed)
* Choose `Upload a template file`.
* Click `Choose file`.
* Select the file `components/vam-silky-smooth-deployments/packages/deployment-pipeline/config/buildspec/cloudformation.yml` from the extracted source code and click `Next`.
* Now specify the stack details. Enter the stack name and required parameters. The parameters each have a description of their function. 
* If the solution is to use an existing VPC and Subnets or connect AppStream Stacks to G Suite domains, specify these too. Consider whether AppStream Fleet instances need to be joined to an AD domain, and/or if Dynamic Catalogs are required. If so, ensure that AdJoined is set to true. Then click `Next`.
* Change any stack options desired and then click Next.
* Ensure that the Admin Email parameter is a valid email address. This is how the initial admin user credentials will be sent.
* Review the configuration, acknowledge that this stack will create IAM resources 
* Create stack.


### Step 4: Obtaining website URL

Once the CloudFormation stack is created, the CodePipeline pipeline deploys the application [https://console.aws.amazon.com/codesuite/codepipeline/pipelines](https://console.aws.amazon.com/codesuite/codepipeline/pipelines). If you have opted to receive
email notifications, you can wait until you receive the notification.

### Step 5: Logging in

To login, check your email for an invite. It will have your temporary password inside. If the page does not render, make sure you add your IP address to the AWS Web Application Firewall.

## Deploy using a pre-existing VPC and subnets

Search for the VPC ID and corresponding private subnet IDs either using the AWS console or AWS CLI.
The VPC and subnets must be in the same region where you plan to deploy the solution.
Paste these parameters in the corresponding fields in the optional CloudFormation parameters section. Note that multiple subnet IDs should be comma separated. 
For more information on VPC configuration, [click here](https://docs.aws.amazon.com/appstream2/latest/developerguide/managing-network-internet-NAT-gateway.html)

## Deploy using a pre-existing VPC, subnets and Active Directory

| WARNING: Active Directory          |
|:---------------------------|
| When using a self-owned Active Directory, you are ***responsible*** for the Active Directory Administration. |

Follow these guidelines when deploying VAM using a pre-existing VPC, subnets and Active Directory:

* The VPC and private subnets must be in the same region where you plan to deploy the solution. The VPC
configuration should be as described above for a pre-existing VPC and subnets. The
Active Directory must either be in the VPC or be in a peered VPC with appropriate routes in place
with an AD Connector deployed and active to proxy requests, and the VPC DHCP options updated to use the Active Directory DNS servers.
You can also leverage an existing Domain Controller (with AD Connector) that resides on-prem as long as there is network connectivity between the VPC and your
on-prem (VPN or Direct Connect). Additional prerequisites for leveraging AD Connector can be found [here](https://docs.aws.amazon.com/directoryservice/latest/admin-guide/prereq_connector.html).

* Active Directory must have an account created that AppStream will use as a service account.
Create a secret in Secrets Manager to store the credentials for
this account. Add two keys named `username` and `password` with the appropriate values.
For more information, see [Granting Permissions to Create and Manage Active Directory Computer Objects](https://docs.aws.amazon.com/appstream2/latest/developerguide/active-directory-admin.html#active-directory-permissions).

* Active Directory must have another account created that the Image Builders will use to install applications.
This account must have sufficient permissions to install the necessary applications. We recommend having a security group that grants
local administrative access to the Image Builder Service account. This can be accomplished by creating a Group Policy Object (GPO) that grants local administrative
rights. [For more information, see Active Directory: GPO to Make a Domain User the Local Administrator for all PCs](https://social.technet.microsoft.com/wiki/contents/articles/7833.active-directory-gpo-to-make-a-domain-user-the-local-administrator-for-all-pcs.aspx).

* Create a separate OU in Active Directory for the AppStream automation. AppStream creates a new computer
object in AD everytime it creates an image builder or a domain joined streaming instance is created (if the domain join option is
enabled for fleets). Additionally, this OU can be leveraged to link any GPOs that are specific to AppStream.

In order to bootstrap the image builder to enable PSRemoting (used to remotely execute commands) we leverage a GPO on the Active Directory domain
that the image builder is a part of. We need to enable WinRM via HTTPS from the local domain network.

If you are supplying your own AD details during deployment then a startup GPO script needs to be [created](https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/dn789196(v=ws.11)) so that every Image Builder starts up running this script.

Below is a sample of the PowerShell script that is automatically deployed when the built-in AD is used.

```
New-Item -Path C:\temp -Force -Type Directory

#Start Logging activity
Start-Transcript -Path "C:\temp\Enable-PsRemoting-log.txt"

#Parameters for the script
$CertPath = "C:\temp\cert.p7b"
$imageBuilderName = (Get-APSImageBuilderList -ProfileName appstream_machine_role | Sort-Object CreatedTime -Descending | Select-Object -Index 0).Name

# Create Self-signed certificate for HTTPS Listener
$Hostname = [System.Net.Dns]::GetHostByName($env:computerName).HostName
$Cert = New-SelfSignedCertificate -CertstoreLocation Cert:\LocalMachine\My -DnsName $Hostname
$CertPrefix = "Certificates/" + $imageBuilderName + ".p7b"
Export-Certificate -Cert $Cert -FilePath $CertPath -Type p7b
Import-Certificate -FilePath $CertPath -CertStoreLocation cert:\LocalMachine\Root

# Enable PSRemoting on Image Builder
Remove-Item WSMan:\localhost\Listener\* -Recurse
Enable-PSRemoting -Force
Get-ChildItem WSMan:\Localhost\listener | Where -Property Keys -eq "Transport=HTTP" | Remove-Item -Recurse
New-Item -Path WSMan:\LocalHost\Listener -Transport HTTPS -Address * -CertificateThumbPrint $Cert.Thumbprint -Force
Set-NetFirewallProfile -Profile Domain -Enabled False # XXX it would be preferable to do this in a better way.

#Stop Logging activity
Stop-Transcript
```

See `components/appstream-image-builder/packages/assembly/assets/deployables/appstream-image-builder/data/{56E694B8-4C08-4594-B9AC-8FE030640822}` for a backup of a sample GPO.

It is recommended to configure the startup script before deploying the CloudFormation template.

### Installation

In the optional section of the CloudFormation parameters, specify the parameters VpcId, SubnetIds,
AdDomain, AdDomainName, Ou, DnsIpAddresses, DirectoryId, AppStreamServiceAccountSecretArn and
ImageBuilderServiceAccountSecretArn. If any Active Directory parameters are not specified the solution
will deploy an AWS Managed Microsoft Active Directory to use.

---

## Interactive Installation

Node.js v14.x or later is required.

Before you can build this project, you need to install [pnpm](https://pnpm.js.org/en/). Run the following command:

```bash
$ npm install -g pnpm
```

Clone with submodules or download and extract the code on your computer at some location. 
We will call the directory where the code is extracted to the `$PROJECT_HOME` directory.
For example, if you cloned the git repository into `some/directory/vam` as follows, the `$PROJECT_HOME` references the `some/directory/vam`.  
```bash
$ cd some/directory
$ git clone <git-url-to-this-repository> vam --recurse-submodules
```

Install dependencies
```bash
$ cd $PROJECT_HOME
$ pnpm install --recursive --frozen-lockfile
```

Before you deploy the project you need to decide which environment a.k.a. stage (such as `dev`, `qa`, `pre-prod`, `prod` etc.) you want to deploy it to.
If you are getting started, it is a common convention to use your username on the computer as the stage name. The instructions below refers to the stage name as `$STAGE_NAME`.
The project requires various settings (configuration variables). Let's create a settings file for the `$STAGE_NAME`.
To create the initial settings files, take a look at the `example.yml` settings file in `$PROJECT_HOME/main/config/settings/example.yml` and create your own file `$PROJECT_HOME/main/config/settings/$STAGE_NAME.yml`.
```bash
$ cd $PROJECT_HOME
$ cp main/config/settings/example.yml main/config/settings/$STAGE_NAME.yml
```
Modify the `main/config/settings/$STAGE_NAME.yml` file you just created and adjust the settings in the file. Please read inline comments in the file to understand each setting.

The project is made up of various components (all components reside under the `$PROJECT_HOME/components` directory). 
The components need to be "assembled" to generate the separately deployable components (SDCs). 

Run following command to "assemble" the project:
```bash
$ cd $PROJECT_HOME
$ pnpx sls solution-assemble --stage $STAGE_NAME 
```

After assembling the components, execute the `solution-deploy` command as follows. The command will deploy the project by deploying all SDCs in correct order.

> **Note:** The `--stage` argument in command below is optional. If you omit the argument, it will use the username of the current user on the computer as the default value.

```bash
$ cd $PROJECT_HOME
$ pnpx sls solution-deploy --stage $STAGE_NAME 
```

Following an initial successful deployment, you can subsequently deploy updates to the individual SDCs `custom-domains`, `web-infra`, `backend`, and `post-deployment` as follows:

```bash
$ cd $PROJECT_HOME/main/.generated-solution/<sdc directory name e.g., web-infra, backend, or post-deployment>
$ pnpx sls deploy -s $STAGE_NAME
$ cd -
```

To run (rerun) the post-deployment steps:

```bash
$ cd $PROJECT_HOME/main/.generated-solution/post-deployment
$ pnpx sls invoke -f postDeployment -s $STAGE_NAME
$ cd -
```

To re-deploy the UI

```bash
$ cd $PROJECT_HOME/main/.generated-solution/ui
$ pnpx sls package-ui --stage $STAGE_NAME --local=true
$ pnpx sls package-ui --stage $STAGE_NAME
$ pnpx sls deploy-ui --stage $STAGE_NAME --invalidate-cache=true
$ cd -
```

To re-deploy the Docs component

```bash
$ cd $PROJECT_HOME/main/.generated-solution/docs
$ pnpx sls package-ui --stage $STAGE_NAME --local=true
$ pnpx sls package-ui --stage $STAGE_NAME
$ pnpx sls deploy-ui-s3 --stage $STAGE_NAME --invalidate-cache=true
$ cd -
```

To view information about the deployed components (e.g. CloudFront URL, root password), run the
following:

```bash
$ cd $PROJECT_HOME
$ pnpx sls solution-info --stage $STAGE_NAME
```

Once you have deployed the app and the UI, you can start developing locally on your computer.
You will be running a local server that uses the same lambda functions code. To start local development, run the following commands to run a local server:

```bash
$ cd $PROJECT_HOME/main/.generated-solution/backend
$ pnpx sls offline -s $STAGE_NAME
$ cd -
```

Then, in a separate terminal, run the following commands to start the ui server and open up a browser:

```bash
$ cd $PROJECT_HOME/main/.generated-solution/ui
$ pnpx sls start-ui -s $STAGE_NAME
$ cd -
```

In a separate terminal, run the following command to start the documentation server:

```bash
$ cd $PROJECT_HOME/main/.generated-solution/docs
$ pnpx sls start-ui -s $STAGE_NAME
$ cd -
```

---

## Audits

To audit the installed NPM packages, run the following commands:

```bash
$ cd $PROJECT_HOME
$ pnpm audit
```

Please follow prevailing best practices for auditing your NPM dependencies and fixing them as needed.

---

## AWS Web Application Firewall (WAF)

After the solution is deployed, an Amazon CloudFront distribution of the website is created.
By default, this distribution is protected by an AWS Web Application Firewall (WAF) configuration which prevents any public IP from accessing the website.

### Allow new IPs to access the website

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

### Disable WAF (Not recommended)

You can disable WAF completely by overwriting the `useCloudFrontWaf` setting and setting it to `false`.
You can do this by editing the setting configuration file for your stage at `config/settings/${stage}.yml` and adding the line:

```yaml
useCloudFrontWaf: false
```
---

## Removing the Solution

There are different methods for removing the solution depending on how it was installed. Different subsections will guide one through various steps and recommendations for removing the solution.

### Removal Prerequisites

VAM creates some artifacts which can place dependencies on components which were deployed with the solution. Examples of dependencies may include connections from EC2 instances or AppStream 2.0 fleets to various VPC components.

#### Remove VAM created AppStream 2.0 Fleets

In the VAM solution, simply go to the Fleets tab, stop any running fleets and delete the fleets. If the VAM solution is unavailable, these operations can be completed from the AWS Console however it is important to note that both the Fleet and its Stack (should be of the same name) should be deleted. If the Stack is to be deleted first, it must first be disassociated from its fleet.

#### Remove any VAM created EC2 instances

In the AWS Console under the EC2 service, look at any existing instances. Specifically look for any with a name of the form ```<environment-name>-<2-letter-region-id>-<solution-name>-installer-host-xxxxxxxx```. where ```xxxxxxxx``` is a generated alpha-numeric disambiguator string. For example, if you chose 'myTestEnv' as the environment name and 'vam' as the solution name and deployed to 'us-east-1 (Virginia)', your installer hosts will be of the form ```myTestEnv-va-vam-install-host-xxxxxxxx```. Terminate these instances.

#### Remove Policies added to VAM deployed Roles

There are reasons one might add policies to IAM roles created by the VAM solution. For instance, one may have specific policies which were added to ```<environment-name>-<2-letter-region-id>-<solution-name>-image-builder-InstallerHostRole-XXX``` role for his or her own monitoring needs. A common role to modify is the ```<environment-name>-<2-letter-region-id>-<solution-name>-LtiHandler``` role. The standard modification is to attach a policy which allows ```CreateStreamingUrl``` on one or more AppStream 2.0 fleets utilized as part of an LTI environment.

Any additional policies attached to IAM roles created by VAM will need to be detached or deleted for the removal process to complete successfully. This can be done from within the IAM service in the AWS Console.


### Deployed Using an AWS CloudFormation template

#### "DemoDeployment" Parameter set to "Yes"

Removing a demo deployment simply requires pipeline approval. During installation, a CodePipeline was created. Simply return to that code pipeline and approve continuation to the next step. Once the pipeline completes, the solution should be removed. If removal via the pipleine fails, use the removal steps under [Deployed via Interactive Deployment](#Deployed-via-Interactive-Deployment) if you have a [development environment](#Interactive-Installation) configured, otherwise, one can [remove the solution manually](#Manually-Removing-the-Solution).

Once the solution has been removed, it is safe to [delete the CodePipeline](#Deleting-the-Code-Pipeline).

### Deleting the Code Pipeline

#### Prerequisite
CloudFormation instalation creates an S3 Bucket and places some objects in it. This bucket should be empty when attempting to remove the CodePipeline. In the S3 Service in the AWS Conosole, locate a bucket which contains the name of the initial stack created by the CloudFormation temmplate followed by the string `-AppArtifactBucket-`. Empty this bucket.

#### Removing the Pipeline
The CodePipeline is owned by the Cloud Formation stack created in the initial step of [deploying via AWS CloudFormation](#Using-an-AWS-CloudFormation-template). The best way to remove the pipeline and its associated roles and infrastructure is to delete that stack. This can be done easily by finding it in the CloudFormation service in the AWS Console and selecting 'Delete' from 'Actions'.

### Deployed via Interactive Deployment

If you want to remove (un-deploy) the solution, run the following command.


> **Note:** this operation can not be undone. Please make sure to un-deploy if you are absolutely sure that you no longer 
need the solution. You can recreate the solution after you remove it but you cannot get the previous solution deployment
back once you remove it.

**FORCE_DELETE**: the ```FORCE_DELETE=true``` option is more destructive than otherwise removing the solution however one will likely encounter errors without it. ```FORCE_DELETE``` will empty several S3 Buckets before attempting to remove the solution. These include

* Installable Applications
* GPO Objects
* Website Content
* Documentation Content
* Logging

The removal process will be unable to remove these buckets if they are not already empty and thus will show errors.

```bash
$ cd $PROJECT_HOME
$ FORCE_DELETE=true pnpx sls solution-remove --stage $STAGE_NAME 
```

### Manually Removing the Solution
If the interactive removal fails, a development environment is unavailable, or the CodePipeline removal option is not available, the solution may be removed manually.

#### Note on S3 Bucket Namespace
S3 Bucket names are required to be globally unique. To maintain this, VAM uses a "namespace" prefix which is made up of the following elements seperated by hyphens (-):

1. AccountId: The twelve digit Account Id under which the solution is installed.
2. Environment Name: This is a user defined field selected at insallation.
3. Region Identifier: A two character identfier for the region. For instance, if VAM is installed to us-west-2 (Oregon), the region identifier will be 'or'.
4. Solution Name: Although this is chosen at installation time, this is typically 'vam'.

As an example, a VAM solution deployed to account 0000-0000-0000 with an environment name of 'test' and a solution name of 'vam' in us-east-1 (Virginia) would have the namespace of `000000000000-test-va-vam`.

#### Empty Buckets

| WARNING: Bucket contents will be permenently deleted          |
|:---------------------------|
| Be sure to backup anything which needs to be saved. |

In the AWS Console, select each bucket from the following list, one at a time, and click 'Empty'. If the bucket is already empty, simply click 'Cancel' on the subsequent screen. Otherwise, type `permanently delete` in the space provided then click 'Empty'

* *namespace*-application-repo
* *namespace*-dap-config
* *namespace*-docs-site
* *namespace*-gpo-templates
* *namespace*-installer-work
* *namespace*-metrics
* *namespace*-website

There is also a logging bucket, but that will need to be emptied later as removal of other compoenents will result in this bucket recieving more data.

#### Removing the CloudFormation Stacks
vam CloudFormation stacks use a naming scheme similar to the [S3 Buckets](#Note-on-S3-Bucket-Namespace) however for CloudFormation, the account ID is omitted. Therefore, following the previous example of the solution deployed to account 0000-0000-0000 in us-east-1 with environment name of 'test' and solution name of 'vam', the namespace prefix will be `test-va-vam`.

Under the CloudFormation service in the AWS Console, delete the following stacks:

* *namespace*-vam
* *namespace*-postDeployment
* *namespace*-eventbridge-infra
* *namespace*-edgeLambda
* *namespace*-image-builder
* *namespace*-customDomains

#### Removing Webinfra
Once the `*namespace*-webinfra` is the only remaining stack, it's time to empty the loggin bucket. Refer to the [earlier section](#Empty-Buckets) for more information on emptying an S3 Bucket, and empty the `*namespace*-logging` bucket. Now go back to the CloudFormation Console page and delete the `*namespace*-webinfra` stack.

### LTI Handler Stack
Most removal methods will skip removing the LTI Handler Lambda stack. This can be discovered by checking the CloudFormation console in the region to which the solution was deployed and searching for a stack named `*namespace*-vam`. If this exists, it is safe to delete at any time during the removal process or afterward.

---

## Cloud Trail

Installing this solution will create a multi-region Cloud Trail prefixed using the solution namespace (environment name-2 character region ID-solution name). It is important to note that if the account already has a Cloud Trail delivering events to a particular location, this additional delivery will incur [some cost](https://aws.amazon.com/cloudtrail/pricing/). While it is recommended to have Cloud Trail enabled, if another Cloud Trail is already tracking events, it should be safe to delete this one.

### Cloud Trail S3 Bucket Retention

The solution will also create an S3 bucket into which the Cloud Trail logs are placed. It is important to note that upon solution removal, the Cloud Trail will be deleted, but this bucket will be retained. The S3 bucket (*environment name*`-`*2 letter region ID*`-`*solution name*`-backend-cloudtrailbucket-`*alphanumeric disambiguator*) can be emptied and deleted once the solution is removed consistent with one's own log retention policies.

---

## Recommended Reading

- [Serverless Framework for AWS](https://serverless.com/framework/docs/providers/aws/)
- [Serverless Stack](https://serverless-stack.com/)
- [Configure Multiple AWS Profiles](https://serverless-stack.com/chapters/configure-multiple-aws-profiles.html)
- [Serverless Offline](https://github.com/dherault/serverless-offline)

## Docusaurus

You can now also view the solution's Docusaurus website. This is accessible from `<website-url>/docs`.

---

This sample code is provided to you as AWS Content under the AWS Customer Agreement, or the relevant written agreement between you and AWS (whichever applies). You should not use this sample code in your production accounts, or on production, or other critical data. You are responsible for testing, securing, and optimizing the sample code as appropriate for production grade use based on your specific quality control practices and standards. AWS may reuse these assets in future engagements, but we will not share your confidential data nor your intellectual property with other customers. Prototyping engagements are offered on a no-fee basis. However, you may incur AWS charges for creating or using AWS chargeable resources, such as running Amazon EC2 instances or using Amazon S3 storage.
