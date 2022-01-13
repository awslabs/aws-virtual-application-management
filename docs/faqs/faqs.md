# AWS Virtual Application Management FAQs

## General

**Q: What is AWS Virtual Application Management (AWS VAM)?**

AWS Virtual Application Management is an AWS solution that was developed to improve the management and deployment of Amazon AppStream 2.0 images at scale. The solution was initially developed through work with Cornell University's IT department and has been abstracted for the use by the general technological community. The intent is to provide a **companion** application for AppStream 2.0 service with the additional capabilites for administrators to create, manage, and deploy images and fleets. At it's core, it is a frontend application that sits on top of the AppStream 2.0 backend resources. Automation is provided through Powershell with the ability for IT to automatically deploy applications by configuring **Chocolatey/Powershell** scripts in an application repository provided by the solution.

**Q: Is AWS VAM replacement for Amazon AppStream 2.0?**

No. Amazon AppStream 2.0 is the next-generation desktop application streaming service from AWS. AWS VAM is a frontend application that makes API calls to the backend AppStream 2.0 images and fleets for higher level management. If needed, backend AppStream 2.0 resources created by AWS VAM through can be accessed through the AWS Management Console, SDK, or CLI. 

**Q: Can I still use my Amazon AppStream 2.0 resources that were created before deploying AWS VAM?**

Yes. Resources created with AWS VAM will not affect the current AppStream 2.0 instances and fleets. Keep in mind that AppStream 2.0 resources created outside of the AWS VAM console will not be available in the solution. To bring those resources over they will need to be recreated within AWS VAM, which can be done by using the AppStream 2.0 image used to create the fleet.

**Q: Will AWS VAM affect my current AppStream 2.0 environment?**

If you are using Active Directory, keep in mind that AWS VAM will create it's own Active Directory if one is not specified during deployment. This may affect how you have setup your deployment. To avoid issues, either specify your existing Active Directory or create the AWS VAM environment with a separate VPC for the Amazon AppStream 2.0 resources.

**Q: Are resources created within AWS VAM available within AppStream 2.0?**

Yes. All AppStream 2.0 resources that will be created through AWS VAM will be available within the AWS Console and programmatically. This allows you to make detailed configurations to your streaming sessions, fleets, and images which are currently not available through AWS VAM. 

**Q: Why use AWS VAM vs. AppStream 2.0?** 

Amazon AppStream 2.0 offers a rich set of features to allow customers to stream non-persistent applications and desktops to end users. These features offer a variety of controls to effectively scale fleets of resources and various properties pertaining to the streaming session. However, customers across industries and verticals have identified the following challenges when working with the service:

1. Building and patching applications on AppStream Image Builders is a time consuming and error prone process
2. IT is often the contact point for launching new AppStream Fleets rather than providing requesters a point-and-click self-service portal
3. It is difficult to understand and optimize usage, requiring additional work to create custom built dashboards

AWS VAM addresses these issues though:

1. Capabilities in managing AppStream Image Builder application repositories through Powershell/Chocolatey automation scripts
2. An easy point-and-click self-service portal enabling users to launch AppStream 2.0 resources without contacting IT
3. Pre-configured Dashboards for understanding resource usage (must enable [AppStream 2.0 Usage Reports](https://docs.aws.amazon.com/appstream2/latest/developerguide/configure-usage-reports.html)

**Q: Do some applications work better with AWS VAM?**

Applications that have been successfully used with AppStream 2.0 should be considered candidates for AWS VAM. However, applications with complex licensing or significant dependence on third party services can present challenges when writing automation scripts with Chocolatey/Powershell. The [Cornell University choco-packages public GitHub repository](https://github.com/CU-CommunityApps/choco-packages/tree/master/packages) has many useful common application samples that can be referenced when creating automation scripts.

**Q: Can I provide my users a desktop experience?**

Yes. AWS VAM allows you to choose choose between an application or desktop stream view for your AppStream 2.0 instances when you configure the fleet. The application view displays only the windows of the applications that are opened by users, while the desktop view displays the standard desktop experience that is provided by the operating system.

**Q: Can AWS VAM be accessed while offline?**

No. AWS VAM requires a sustained internet connection or network route to access the frontend application as well as to communicate with the backend AWS services. 

**Q: What does the AWS VAM environment consist of?**

AWS VAM consists of:

Frontend: static Amazon S3 website fronted by Amazon CloudFront with authentication enabled through Cognito. Users can use the frontend to manage their application and backend AppStream 2.0 resources.

Backend: API Gateway, DynamoDB, and S3 buckets to capture changes made through the frontend and store applications configurations.

Active Directory and EC2 Host instances: secure authentication for users into AppStream 2.0 instances is provided through Active Directory, while also being the means to allow an EC2 Host to use PS Remoting to install applications onto the AppStream Image Builder through automation scripts.

**Q: How do I use my AWS Direct Connect, AWS VPN, or other VPN tunnel to stream my applications?**

First, create an Amazon Virtual Private Cloud (Amazon VPC) endpoint in the same Amazon VPC as the AWS Direct Connect, AWS VPN, or other VPN tunnel. Then, specify the VPC endpoint when creating a new stack, modifying an existing one, or creating a new image builder. Users will then use the VPC endpoint when they stream their applications. To learn more about the AppStream 2.0 streaming VPC endpoints, see Creating and Streaming From VPC Interface Endpoints in the AppStream 2.0 Administration Guide. 

**Q: Are all AppStream 2.0 instance types available in AWS VAM?**

Q: Does Amazon AppStream 2.0 offer GPU-accelerated instances?

Yes. All AppStream 2.0 instance types, including Graphics Design, Graphics Pro, and Graphics G4 instance families, are available to launch with AWS VAM. Ensure to increase your service quota limits for instances and fleet size through AWS Support.

## Getting started

**Q: How do I get started with AWS VAM?**

To get started, navigate to the [AWS VAM GitHub repository](https://github.com/awslabs/aws-virtual-application-management) and clone the solution. Once that is complete, follow the README.md to launch the solution either through AWS CloudFormation or programmatically.

**Q: What resources do I need to set up to stream my applications using AWS VAM?**

The resources required are as follows:

1. Provide an AWS VPC and an Active Directory configuration (AD Connector or AWS Managed Active Directory) to successfully launch the solution. If you do not have one currently configured, you can have the solution create a VPC and an AWS Managed Active Directory for you.
2. Once the solution is launched, ensure to whitelist the IP range within AWS WAF that will be used to access the frontend.  
3. Once you successfully log into AWS VAM, depending on your initial launch configuration, you will have to add applications into the S3 application repository. If you launched with demo applications enabled, you will have a prepopulated list. From their, launch your images and fleets. 
4. Once the fleet is succesfully created, you can test out the streaming applications from within AppStream 2.0. 

**Q: How do I configure my applications in AWS VAM?**

At a high level, you will need to configure either a Powershell or Chocolatey scripts inside of the S3 application repository. Once this is done properly, the application will automatically populate the list of available applications within VAM. For more details please see the documentation on [Application Repository](https://awslabs.github.io/aws-virtual-application-management/user-guide/applicationRepository.html).

**Q:  Will I need to access the AppStream 2.0 Image Builder during the application installation process?**

For many applications, this will not be necessary. Applications can be installed simply by launching the image builder with the desired applications and having the scripts configure everything. In cases where complex licensing or additional configurations are required, you may need to access the Image Builder once the applications are installed. This can be done my keeping the AppStream Image Builder available after all applications have been installed and logging into the instance through the AWS Management Console. 

**Q: What instance types are available to use with AWS VAM?**

Amazon AppStream 2.0 provides a menu of instance types for configuring a fleet or an image builder. You can select the instance type that best matches your applications and end-user requirements. You can choose from General Purpose, Compute Optimized, Memory Optimized, Graphics Design, Graphics Pro and Graphics G4 instance families. 

**Q: Can I change an instance type after creating a fleet?**

Yes, but not within AWS VAM. You can change your instance type after you have created a fleet within the AWS Console or programmatically. To change the instance type, you will need to stop the fleet, edit the instance type, and then start the fleet again. For more information, see Set up AppStream 2.0 Stacks and Fleets.

**Q: Can I use custom branding with AWS VAM?**

Yes. To do this, you will need to familiarize yourself with the cloned GitHub repository and make changes using the branding that you desire. Unfortunately, there does not exist an easy way to do this within the AWS VAM frontend itself. 

As for branding your AppStream 2.0 images, you will have to do that within the AWS Console. You can customize your users' Amazon AppStream 2.0 experience with your logo, color, text, and help links in the application catalog page. To replace AppStream 2.0's default branding and help links, log in to the AppStream 2.0 console, navigate to Stacks, and select a your application stack. Then, click Branding, choose Custom, select your options, and click Save. Your custom branding will apply to every new application catalog launched using SAML 2.0 single-sign-on (SSO) or the CreateStreamingURL API. You can revert to the default AppStream 2.0 branding and help links at any time. To learn more, visit Add Your Custom Branding to Amazon AppStream 2.0.

**Q: Can users save their application settings?**

Yes, but not through AWS VAM. You can enable persistent application and Windows settings for your users on AppStream 2.0 through the AWS Console. Your users' plugins, toolbar settings, browser favorites, application connection profiles, and other settings will be saved and applied each time they start a streaming session. Your users' settings are stored in an S3 bucket you control in your AWS account.
 
## Demo applications

**Q: Are demo applications with AWS VAM?**

Yes. When setting up your environment through AWS Cloudformation or programmatically, ensure that the field for DemoApplications is set to true. This will launch a list of preconfigured applications in an application repository with applications including, but not limited to, Firefox, Google Chrome, Notepad, etc. This is also a great way to see how applications are configured in the S3 application repository.

**Q: Will I be charged for using the demo applications?**

You won’t be charged any AWS fees for using the demo applications. All applications are free to the public by their providers. However, you may incur other fees such as Internet or broadband charges and AppStream resources to run the applications.

**Q: Can I add an application to be included in the demo repository bucket?**

Yes. Once AWS VAM is launched, you may navigate to the application repository bucket that was configured and begin adding your own applications. Remember, this can be done either using Powershell or Chocolatey.

**Q: What is Powershell?**

PowerShell is a cross-platform task automation solution made up of a command-line shell, a scripting language, and a configuration management framework. As a scripting language, PowerShell is commonly used for automating the management of systems. In our solution, since AppStream 2.0 and Active Directory are Windows based technologies, the scripting language is preconfigured in the environment and automatically supported without the need for the user to add anything.

**Q: What is Chocolatey?**

[Chocolatey](https://chocolatey.org/) is the largest online registry of Windows packages. Chocolatey packages encapsulate everything required to manage a particular piece of software into one deployment artifact by wrapping installers, executables, zips, and/or scripts into a compiled package file. In our solution the package manager is preconfigured in the environment and automatically supported without the need for the user to install anything. We recommend using Chocolatey whenever possible as it is simple to use, but more complex applications configurations may require the use of Powershell.

## Images

**Q: How can I create AppStream 2.0 images with my own applications on AWS VAM?**

At a high level, you will need to configure either a Powershell or Chocolatey scripts inside of the S3 application repository. Once this is done properly, the application will automatically populate the list of available applications within VAM. For more details please see the documentation on [Application Repository](https://awslabs.github.io/aws-virtual-application-management/user-guide/applicationRepository.html).

After that is successfully done, you will navigate to the Images section of AWS VAM to configure the image specifications of your deployment. You will have the option of choosing your application from the list when configuring the Image. After successfully starting the image builder process, all you have to do is wait for it to create a install your applications using the scripts, which takes about 40 minutes to an hour. For more information please see our documentation on [AppStream Images](https://awslabs.github.io/aws-virtual-application-management/user-guide/sidebarAppStreamImages.html).

**Q: With which operating system do my apps need to be compatible?**

Amazon AppStream 2.0 streams applications that can run on the following 64-bit Windows OS versions - Windows Server 2012 R2, Windows Server 2016 and Windows Server 2019. You can add support for 32-bit Windows applications by using the WoW64 extensions. If your application has other dependencies, such as the .NET framework, include those dependencies in your application installer.

**Q: Can I install anti-virus software on my Amazon AppStream 2.0 image to secure my applications?**

You can install any tools, including anti-virus programs on your AppStream 2.0 image. However, you need to ensure that these applications do not block access to the AppStream 2.0 service. We recommend testing your applications before publishing them to your users. You can learn more by reading Antivirus Software on AppStream 2.0 and Data Protection in AppStream 2.0 in the [Amazon AppStream 2.0 Administration Guide](https://docs.aws.amazon.com/appstream2/latest/developerguide/appstream2-dg.pdf).

**Q: Can I customize the Windows operating system using group policies?**

Any changes that are made to the image using Image Builder through local group policies will be reflected in your AppStream 2.0 images. Any customizations made with domain based group policies will also be applied to the fleets, as AppStream 2.0 images are domain joined within AWS VAM.

**Q: How do I keep my Amazon AppStream 2.0 images and applications updated?**

AppStream 2.0 regularly releases base images that include operating system updates and AppStream 2.0 agent updates. The AppStream 2.0 agent software runs on your streaming instances and enables your users to stream applications. When you create a new image, the *Always use latest agent version* option is selected by default. When this option is selected, any new image builder or fleet instance that is launched from your image will always use the latest AppStream 2.0 agent version. To deselect this option you would need to go through the AWS Console. If it is diselected, your image will use the agent version you selected when you launched the image builder. 

As for your applications, you will need to update the package number within the S3 application repository periodically and relaunch the image builder instances through AWS VAM to release those updates. Doing so will allow the package manager to grab the specified package version. Existing streaming instances will be replaced with instances launched from the new image within 16 hours or immediately after users have disconnected from them, whichever is earlier. You can immediately replace all the instances in the fleet with instances launched from the latest image by stopping the fleet, changing the image used, and starting it again.

**Q: Can I connect my Amazon AppStream 2.0 applications to my existing resources, such as a licensing server with AWS VAM?**

Yes. Amazon AppStream 2.0 allows you to launch streaming instances (fleets and image builders) in your VPC, which means you can control access to your existing resources from your AppStream 2.0 applications. Keep in mind that this configuration will require either manual configuration once the applications are installed on the image builder, or automation through Powershell scripts.

**Q. Can I copy my Amazon AppStream 2.0 images with AWS VAM**?

Yes. Within the AWS VAM Console, when you configure an image, you can choose a base image to build from. Not adding additional configurations except for the name of the new image will clone the base image with all it's configuration applications. To copy those images across regions you will need to access the AWS Console.

**Q: Can I share application images with other AWS Accounts with AWS VAM?**

No. You will need to access the AWS Console or configure this programmatically. You can share your AppStream 2.0 application images with other AWS accounts within the same AWS Region. You control the shared image and can remove it from another AWS account at any time. To learn more, visit [Administer Your Amazon AppStream 2.0 Image](https://docs.aws.amazon.com/appstream2/latest/developerguide/administer-images.html).

## Fleets

**Q: Are Amazon Appstream 2.0 fleets different from AWS VAM fleets?**

Yes, though within AWS VAM a fleet is combined with the streaming session to create a logical whole. Fleets in AppStream 2.0 consist of configuration details such as instance type and size, networking, and user session timeouts. Traditionally, you would also configure a Session configuration to the Fleet to define additional capabilities such as Authentication, Persistent Storage, and Branding. Within AWS VAM, this separation of logical entities does not exist to simplify the launch experience for users.

**Q: What types of fleets are available with AWS VAM?**

AWS VAM offers two fleet types: Always-On and On-Demand. These fleet types allow you to choose how applications and desktops are delivered, the speed of session start, and cost to stream. Elastic Fleets are currently not supported, though are being actively reviewed by the development team.

**Q: What are the differences between the fleet types within AWS VAM?**

Always-On and On-Demand fleet streaming instances are launched using the custom AppStream 2.0 image that you create that contains your applications and configurations. You can specify how many instances to launch manually, or dynamically using Fleet Auto Scaling policies. Streaming instances must be provisioned before a user can stream.

**Q: Can I switch my Amazon AppStream 2.0 Always-On fleet to On-Demand or vice versa within AWS VAM?**

You can only specify the fleet type when you create a new fleet, and you cannot change the fleet type once the fleet has been created.

**Q: What are the benefits to Always-On and On-Demand fleets?**

Always-On and On-Demand fleets are best for when your applications require Microsoft Active Directory domain support, or can only be delivered using an AppStream 2.0 image. Always-On fleet streaming instances provide instant access to applications and you pay the running instance rate even when no users are streaming. On-Demand fleet streaming instances launch the application after an up to 2-minute wait, and you pay the running instance rate only when users are streaming. On-Demand fleet streaming instances that are provisioned but not yet used are charged at a lower stopped instance fee. You manage the capacity of Always-On and On-Demand fleet streaming instances using auto scaling rules.

## Auto scaling

**Q: Does AWS VAM allows me to define auto scaling for my fleets?**

Yes. AWS VAM allows you to define your minimum and maximum fleet size for your autoscaling configuration. To configure dynamic scaling policies based on a schedule, usage, or both you will need to access the AWS Console within the fleet section or configure those programmatically. 

**Q: How can I create auto scaling policies for my Amazon AppStream 2.0 fleet within AWS VAM?**

During the fleet configuration process there will be a section for you to define your minimum and maximum number of instances for the autoscaling fleet to follow.

**Q: What is the minimum size I can set for my Amazon AppStream 2.0 fleet within AWS VAM?**

You can set your Fleet Auto Scaling policies to scale in to zero instances. However, your initial configuration within AWS VAM will need to have a fleet size of at least one. 

**Q: What is the maximum size I can set for my Amazon AppStream 2.0 fleet within AWS VAM?**

Fleet Auto Scaling policies increase fleet capacity until it reaches your defined maximum size or until service limits apply. For more information, please see Fleet Auto Scaling for Amazon AppStream 2.0. For service limit information, please see Amazon AppStream 2.0 Service Limits.

**Q: Are there additional costs for using Fleet Auto Scaling policies with Amazon AppStream 2.0 fleets within AWS VAM?**

There are no charges for using Fleet Auto Scaling policies. However, each CloudWatch alarm that you create and use to trigger scaling policies for your AppStream 2.0 fleets may incur additional CloudWatch charges. For more information, see Amazon CloudWatch Pricing.

## Persistent storage

**Q: Does AWS VAM allow me to configure persistent storage so that I can save and access files between sessions?**

Yes, but the functionality is currently limited to Google Drive and Home Folders. By default, AWS VAM configures Home Folders for your AppStream 2.0 persistent storage. While launching AWS VAM, you can define your Google Drive for G Suite Domain within the solution so that your fleets launch with your preferred persistent storage provider. If you need to configure Microsoft One Drive for Business, you will need to configure that in the streaming page of the Amazon AppStream 2.0 Console or programmatically. 

**Q: Are there any differences in accessing persistent within Amazon AppStream 2.0 sessions launched using AWS VAM?**

No. Users can access a home folder during their application streaming session. Any file they save to their home folder will be available for use in the future. 

**Q. Can I enable multiple persistent storage options for an Amazon AppStream 2.0 stack with AWS VAM?**

Yes. If you configured Google Drive when launching AWS VAM, Home Folders and Google Drive for G Suite will be available within your AppStream 2.0 streaming sessions. To Microsoft OneDrive for Business you will need to configure that through the AWS Console or programmatically. 

**Q. How do I enable Google Drive for G Suite for Amazon AppStream 2.0 within AWS VAM?**

When launching AWS VAM, add the name and G Suite Domain Name in the appropriate sections of the AWS CloudFormation template or programmatically.

**Q. Can a user remove their Google Drive for G Suite account within AWS VAM?**

No. You will need to either relaunch the solution or disable it within the AWS Console or programmatically.

**Q: How is the data stored in my user's home folders secured?**

Files and folders in your users' home folders are encrypted in transit using Amazon S3's SSL endpoints. Files and folders are encrypted at rest using Amazon S3-managed encryption keys.

## Monitoring

**Q: How do I monitor usage of my Amazon AppStream 2.0 fleet resources within AWS VAM?**

When you logging into the solution, there see 7-8 icons on the left hand side of the dashboard, depending on how you configured the solution. The first one is the Dashboard feature of AWS VAM. 

The Dashboard feature comes with two dashboards to explore: 

**Average Session Length**: this provides the combined average session length by a fleet in minutes. This way you can tell which fleets and at what times have the longest sessions on average.

**Daily Sessions**: Combines the total amount of daily sessions for a given fleet in minutes to have a broad look which fleets are being used the most. 

You can also view the fleet metrics through the Amazon AppStream 2.0 console or within Amazon CloudWatch.

**Q: Can I add additional metrics into AWS VAM?**

Yes, you can create custom metrics for Amazon AppStream 2.0 through AWS VAM. Keep in mind that this will involve making changes to the code repostiroy of the solution.

**Q: Do I need to do any additional configurations to start?**

Metrics monitoring is heavily tied to [User Sessions Reports](https://docs.aws.amazon.com/appstream2/latest/developerguide/enable-usage-reports.html). The solution enables User Sessions Reports by default. User Sessions Reports collects detailed metrics on Amazon Appstream usage and stores the information as a CSV file in Amazon S3. This data will collect information from all running fleets in your AppStream 2.0 environment and display them on this dashboard. Currently this functionality is still in development and may require a partner to configure.

## Streaming

**Q: Can I restrict network access from fleets and image builders launched in my VPC using AWS VAM?**

Yes. You have the ability to configure your own VPC when launching the AWS VAM solution. This will require the vpc and two subnets for a highly available deployment. The restrict network access, configure security groups to specify network traffic that is allowed between your streaming instances and resources in your VPC. Whenever you launch and image builder or fleet, AWS VAM will launch those resources in the configured VPC. 

**Q: Can I change my VPC configuration within AWS VAM?**

No. Changing your VPC configuration will require accessing the AWS Console to edit your network setup or acessing resources programmatically.

**Q: Can I change the security groups to which my fleets are assigned after they have been created?**

Yes, but not within AWS VAM. This will have to be done through the AWS Console or programmatically. You can change the security groups to which your fleets are assigned, so long as they are in the stopped status.

**Q: Can I control data transfer between AppStream 2.0 and my users' devices?**

Yes. You can choose whether to allow users to transfer data between their streaming applications and their local device through copy or paste, file upload or download, or print actions. This will have to be configured through the AWS console or programmatically. To learn move, visit [Create Fleets and Stacks](https://docs.aws.amazon.com/appstream2/latest/developerguide/set-up-stacks-fleets.html).

**Q: Can I stream my applications through AWS VAM?**

Yes. When your fleet successfully launches, you may test a streaming instance to make sure that your applications work as expected. To have others access your AppStream 2.0 fleet securely you will want to integrate with your Active Directory, SSO Provider, or LTI system.

## Identity

**Q: How do I authenticate users into AWS VAM?**

By default, the solution will configure authentication into AWS VAM with Amazon Cognito. An administrator will provide their email and given an ability to setup their password. To configure your preferred method of signing users into AWS VAM you will need to configure that during the setup process. Once this is configured, changing your preferred authentication provider will require redeploying the solution.

**Q: Can I use AWS VAM with my existing user directory, including Microsoft Active Directory?**

Yes. AWS VAM supports identity federation using SAML 2.0, which allows you to use your existing user directory to manage end user access to the solution.

**Q: Does AWS VAM allow me to setup authentication into Amazon AppStream 2.0 instances?**

Yes. This will require setting up your own identity provider through the Amazon AppStream 2.0 solution in the code base before deployment.

## Dynamic Applications

**Q: What are dynamic applications?**

**Q: Can I dynamically entitle users to apps with AWS VAM?**

Yes, you can use the dynamic app framework APIs to build a dynamic app provider that specifies what apps uers can launch at run-time. The apps provided can be virtualized apps that are delivered from a Windows file share or other storage technology. To learn more, see Manage App Entitlement with the Dynamic App Framework.

**Q: Do I need to configure any additional steps to start using dynamic applications within AWS VAM?**

TODO

## Microsoft Active Directory domain support

Q: Can I join Amazon AppStream 2.0 image builders to Microsoft Active Directory domains?

Yes, Amazon AppStream 2.0 Windows OS-based streaming instances can be joined to your Microsoft Active Directory domains. This allows you to apply your existing Active Directory policies to your streaming instances, and provides your users with single sign on access to Intranet sites, file shares, and network printers from within their applications. Your users are authenticated using a SAML 2.0 provider of your choice, and can access applications that require a connection to your Active Directory domain. You can join image builders, Always-On fleet streaming instances, and On-Demand fleet streaming instances that use the Windows OS to Active Directory domains. Linux OS-based AppStream 2.0 image builders, Always-On fleet streaming instances, and On-Demand fleet streaming instances cannot be joined to Active Directory domains.

Q: What Microsoft Active Directory versions are supported?

Microsoft Active Directory Domain Functional Level Windows Server 2008 R2 and newer are supported by Amazon AppStream 2.0.

Q: Which AWS Directory Services directory options are supported by Amazon AppStream 2.0?

Amazon AppStream 2.0 supports AWS Directory Services Microsoft AD. Other options such as AD Connector and Simple AD are not supported. To learn more about AWS Microsoft AD see What Is AWS Directory Service.

Q: How do I join my Amazon AppStream 2.0 instances to my Microsoft Active Directory domain?

To get started you will need a Microsoft Active Directory domain that is accessible from an Amazon VPC, the credentials of a user with authority to join the domain, and the domain Organizational Unit (OU) you want to join to your fleet. For more information, see Using Active Directory Domains with AppStream 2.0.

Q: Can I use my existing Organization Units (OU) structure with Amazon AppStream 2.0?

Yes, you can use your existing Organizational Unit (OU) structure with Amazon AppStream 2.0. To learn more, see Using Active Directory Domains with AppStream 2.0.

Q: What gets joined to my Microsoft Active Directory domain by Amazon AppStream 2.0?

Amazon AppStream 2.0 will automatically create a unique computer object for every image builder and Always-On or On-Demand fleet instance you configure to be joined to your Microsoft Active Directory domain.

Q: How can I identify Amazon AppStream 2.0 computer objects in my Microsoft Active Directory domain?

Amazon AppStream 2.0 computer objects are only be created in the Microsoft Active Directory Organization Unit (OU) you specify. The description field indicates that the object is an AppStream 2.0 instance, and to which fleet the object belongs. To learn more, see Using Active Directory Domains with AppStream 2.0.

Q: How are computer objects that are created by Amazon AppStream 2.0 deleted from my Microsoft Active Directory domain?

Computer objects created by Amazon AppStream 2.0 that are no longer used will remain in your Active Directory (AD) if the AppStream 2.0 fleet or image builder is deleted, you update a fleet or image builder to a new OU, or select a different AD. To remove unused objects you will have to delete them manually from your AD domain. To learn more, see Using Active Directory Domains with AppStream 2.0.

Q: How do I provide users with access to Amazon AppStream 2.0 streaming instances that are joined to a Microsoft Active Directory domain?

To enable user access, you will need to set up federated access using a SAML 2.0 provider of your choice. This allows you to use your existing user directory to control access to streaming applications available via Amazon AppStream 2.0. For details on setting up SAML 2.0 integration, see the steps outlined at Setting Up SAML.

Q: Can I connect my users that are managed through User Pools to my Active Directory domain?

No. At this time we do not support User Pools users connecting to domain joined resources. To learn more about User Pools see, Using the AppStream 2.0 User Pool.

Q: How do my users sign in to streaming instances that are joined to an Active Directory domain?

When your users access a streaming instance through a web browser, they sign in to their Microsoft Active Directory domain by entering their domain password. When your users access a streaming instance by using the AppStream 2.0 client for Windows, they can either enter their Active Directory domain password or use a smart card that is trusted by the Active Directory domain. 

## Pricing and billing

Q: How much does Amazon AppStream 2.0 cost?

You are charged for the streaming resources in your Amazon AppStream 2.0 environment, and monthly user fees per unique authorized user accessing applications via Windows operating system based Amazon AppStream 2.0 streaming instance. You pay for these on-demand, and never have to make any long-term commitments.

The streaming resources consist of Amazon AppStream 2.0 instances in your Amazon AppStream 2.0 fleet as well as image builder instances. You have the option to have Always-On and On-Demand fleets. For Always-On fleets you pay for instances in your fleet that are running, even if users are not connected. These instances are billed per hour or per second based on the operating system and fleet type you select, and the price per hour is based on the instance type you select. For On-Demand fleets you pay for the instances in your fleet that are running only when a user is connected. These instances are billed per hour or per second based on the operating system you select, and the price per hour is based on the instance type you select. In an On-Demand fleet if an instance is running but not connected to a user, you pay a nominal hourly On-Demand Stopped Instance fee, which is the same for all instance types within a region. Image builder instances are only available as always on, and you pay for instances that are running, even if users are not connected. The charge for Always-On and On-Demand fleet instances as well as image builder instances includes the cost of the storage volumes used by the Amazon AppStream 2.0 image, and outbound bandwidth used by the streaming protocol. You can control the number of streaming instances in an Always-On or On-Demand fleet using fixed or dynamic scaling policies.

Elastic fleet streaming instances are billed per second with a minimum of 15 minutes for the duration of the streaming session, with a price per hour based on the instance type you select when creating the fleet.

The monthly user fee is used to pay for the Microsoft Remote Desktop Services Subscriber Access License (RDS SAL). This fee is charged per unique authorized user, and is charged in full (not pro-rated), regardless of when a user first accesses Amazon AppStream 2.0 in that month when streaming from a Microsoft Windows Server streaming instance. Schools, universities, and public institutions may qualify for reduced user fees. Please reference the Microsoft Licensing Terms and Documents for qualification requirements. If you think you may qualify, please contact us. We will review your information and work with you to reduce your Microsoft RDS SAL fee. There is no user fee incurred when using image builder instances or when streaming from Linux-based streaming instances.

You are charged separately for your usage of Amazon Simple Storage Service (S3) for any data stored within S3 buckets within your account.

Q: Can I bring my own licenses and waive the user fees?

Yes. If you have Microsoft License Mobility, you may be eligible to bring your own Microsoft RDS CAL licenses and use them with Windows based Amazon AppStream 2.0. For users covered with your own licenses, you won’t incur the monthly user fees. For more information about using your existing Microsoft RDS SAL licenses with Amazon AppStream 2.0, please visit this page, or consult with your Microsoft representative.

Q: What are the requirements for schools, universities, and public institutions to reduce their user fee?

Schools, universities, and public institutions may qualify for reduced user fees. Please reference the Microsoft Licensing Terms and Documents for qualification requirements. If you think you may qualify, please contact us. We will review your information and work with you to reduce your Microsoft RDS SAL fee. There is no user fee incurred when using image builder instances.

Q: What do I need to provide to qualify as a school, university, or public institution?

You will need to provide AWS your institution's full legal name, principal office address, and public website URL. AWS will use this information to qualify you for AppStream 2.0's reduced user fees for qualified educational institutions. Please note: The use of Microsoft software is subject to Microsoft’s terms. You are responsible for complying with Microsoft licensing. If you have questions about your licensing or rights to Microsoft software, please consult your legal team, Microsoft, or your Microsoft reseller. You agree that we may provide the information to Microsoft in order to apply educational pricing to your Amazon AppStream 2.0 usage.

Q. Does qualification for Amazon AppStream 2.0's reduced RDS SAL user fees affect other AWS cloud services?

No, your user fees are specific to Amazon AppStream 2.0, and do not affect any other AWS cloud services or licenses you have.

Q: Can I use tags to obtain usage and cost details for Amazon AppStream 2.0 on my AWS monthly billing report?

Yes. When you set tags to appear on your monthly Cost Allocation Report, your AWS monthly bill will also include those tags. You can then easily track costs according to your needs. To do this, first assign tags to your Amazon AppStream 2.0 resources by following the steps in Tagging Your AppStream 2.0 Resources. Next, select the tag keys to include in your cost allocation report by following the steps in Setting Up Your Monthly Cost Allocation Report.

Q: Are there any costs associated with tagging Amazon AppStream 2.0 resources?

There are no additional costs when using tags with Amazon AppStream 2.0.

## Compliance

Q: Is Amazon AppStream 2.0 HIPAA eligible?

Yes. If you have an executed Business Associate Addendum (BAA) with AWS, you can use Amazon AppStream 2.0 with the AWS accounts associated with your BAA to stream desktop applications with data containing protected health information (PHI). If you don’t have an executed BAA with AWS, contact us and we will put you in touch with a representative from our AWS sales team. For more information, see HIPAA Compliance. 

Q: Is AppStream 2.0 PCI Compliant?

Yes. Amazon AppStream 2.0 is PCI compliant and conforms to the Payment Card Industry Data Security Standard (PCI DSS). PCI DSS is a proprietary information security standard administered by the PCI Security Standards Council, which was founded by American Express, Discover Financial Services, JCB International, MasterCard Worldwide and Visa Inc. PCI DSS applies to all entities that store, process or transmit cardholder data (CHD) and/or sensitive authentication data (SAD) including merchants, processors, acquirers, issuers, and service providers. The PCI DSS is mandated by the card brands and administered by the Payment Card Industry Security Standards Council. For more information, see PCI DSS Compliance.

Q: Is Amazon AppStream 2.0 included in the System and Organizational Controls (SOC) reports?

Yes. Amazon AppStream 2.0 is included in the AWS System and Organizational Controls (SOC) reports. AWS System and Organization Controls Reports are independent third-party examination reports that demonstrate how AWS achieves key compliance controls and objectives. The purpose of these reports is to help you and your auditors understand the AWS controls established to support operations and compliance. You can learn more about the AWS Compliance programs by visiting AWS Compliance Programs or by visiting the Services in Scope by Compliance Program.

## Launch deployment types

## Workflows

## Partners

## Security, Authentication

Q: How is the data from my streamed application encrypted to the client?

The streamed video and user inputs are sent over HTTPS and are SSL-encrypted between the Amazon AppStream 2.0 instance executing your applications, and your end users.
