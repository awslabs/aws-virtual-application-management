---
id: create-image
title: Creating Appstream Images
sidebar_label: Create Image
---

The Create Image page allows the user to fill a form with data necessary in order to create a new Appstream image. The form is accessible by clicking on the *Create Image* button on the [Appstream Image list page](introduction). The form requests the following data.

### Basic Settings

- **Name**: the name of the image to be created. This name must be unique within the account to which the solution is deployed.
- **Image Builder Instance Type**: this field presents a dropdown with the various instance types available for use with the solution. See [Amazon EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/) for a comprehensive list of instance types and specifications.
- **Applications**: This is a list of applications available for an image. Check the box for each application to be installed. At least one new application must be installed on the imgae. If an base image is to be used (advanced), the applications on the base image need not be selected.
- (only if deployed with customer owned AD) **Dynamic Catalogs Enabled?**: Toggle the Dynamic Catalogs feature on/off. With *Dynamic Catalogs*, one can limit access to one or more applications on a fleet to a particular Active Directory (AD) group. This feature is only available if one supplies settings at solution deployment time to utilize an existing Active Directory. If utilizing a solution deployed AD, the Dynamic Catalogs are not available.
### Advanced Settings
- **Base Images**: Here a dropdown will list images which already exist in the solution. Optionally select an image to use as the base image for this image. New applications selected from the list in the form will be added to the base image which will then be used to create the new image.
- **Image Builder ID**: If a previously used image builder already exists, it will be listed in this drop down. This is similar to utilizing a base image in that the image builder will be used with the settings of the previous task completed on that image builder.
- **Snapshot Image Builder**: *IMPORTANT*: if this is turned **OFF**, no new image will actually be created. The steps will be run, but the snapshot is what completes the image generation process. This should usually be left **ON**.
- **Delete Image Builder**: By default the *Image Builder* is deleted once image generation is complete (whether or not the a snapshot was created). An Image Builder is a running VM and incurs cost and should be deleted if there is no intended further use. The follwoing is an example scenario where one may wish to *NOT* delete the image builder after completion.
  - Use the Create Image form to create an image
    - skip installing at least one application
    - do not snapshot the image builder
    - do not delete the image builder
  - Use the AWS Conosle access the image builder through the AppStream 2.0 service.
    - do additional advanced configuration on the image builder
    - log out of the image builder
  - Use the Create Image form to create the final image
    - add the last application(s)
    - snapshot the image builder
    - optionally delete the image builder

When all fields on the form are completed as needed, click "*Create Image*" to complete the image creation process. Click "*Cancel*" at anytime to abort and return to the [image list](introduction).