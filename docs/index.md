## Welcome to AWS Virtual Application Management (AWS VAM)

**Amazon AppStream 2.0** offers a rich set of features to allow customers to stream non-persistent applications and desktops to end users. These features offer a variety of controls to effectively scale fleets of resources and various properties pertaining to the streaming session. However, customers across industries and verticals have identified the following challenges when working with the service:

1. Building and patching applications on AppStream Image Builders is a time consuming and error prone process
2. IT is often the contact point for launching new AppStream Fleets rather than providing requesters a point-and-click self-service portal
3. It is difficult to understand and optimize usage, requiring additional work to create custom built dashboards

Based on feedback from various customers, AWS VAM was developed as solution to address the management and deployment of images at scale. The intent is to provide a **companion application** for AppStream 2.0 with the additional capabilites for administrators to create, manage, and deploy images and fleets. At it's core, it is a frontend application that sits on top of the AppStream 2.0 backend resources, a sample of which can be seen in the image below. Automation is provided through Powershell with the ability for IT to automatically deploy applications by configuring **Chocolatey/Powershell** scripts in an application repository provided by the solution.

### Documentation

To learn more about launching and using the AWS solution, please checkout [Documentation](/documentation.md)
