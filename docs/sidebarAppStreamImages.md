# AppStream Images

The Appstream Images page allows the user to view a list of images which have been created within the solution. It provides the user with a button to create images (see [Create New Appstream Images within VAM](#creating-appstream-images)).

With each images listed, the user will note the following data:

**Image name**\
**Image status**: including 'Available', 'Processing' or 'Error'

Each image listing also provides the following actions:

[Details](#image-details)\
[Delete Image](#deleting-appstream-images)
    
## Creating Appstream Images

The Create Image page allows the user to fill a form with data necessary in order to create a new Appstream image. The form is accessible by clicking on the Create Image button on the Appstream Image list page. The form requests the following data.

### Basic Settings

**Name**: the name of the image to be created. This name must be unique within the account to which the solution is deployed.

**Image Builder Instance Type**: this field presents a dropdown with the various instance types available for use with the solution. See [Amazon EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/) for a comprehensive list of instance types and specifications.

**Applications**: This is a list of applications available for an image. Check the box for each application to be installed. At least one new application must be installed on the imgae. If an base image is to be used (advanced), the applications on the base image need not be selected.

(only if deployed with customer owned AD) **Dynamic Catalogs Enabled?**: Toggle the Dynamic Catalogs feature on/off. With Dynamic Catalogs, one can limit access to one or more applications on a fleet to a particular Active Directory (AD) group. This feature is only available if one supplies settings at solution deployment time to utilize an existing Active Directory. If utilizing a solution deployed AD, the Dynamic Catalogs are not available.

### Advanced Settings

**Base Images**: Here a dropdown will list images which already exist in the solution. Optionally select an image to use as the base image for this image. New applications selected from the list in the form will be added to the base image which will then be used to create the new image.

**Image Builder ID**: If a previously used image builder already exists, it will be listed in this drop down. This is similar to utilizing a base image in that the image builder will be used with the settings of the previous task completed on that image builder.

**Snapshot Image Builder**: IMPORTANT: if this is turned OFF, no new image will actually be created. The steps will be run, but the snapshot is what completes the image generation process. This should usually be left ON.

**Delete Image Builder**: By default the Image Builder is deleted once image generation is complete (whether or not the a snapshot was created). An Image Builder is a running VM and incurs cost and should be deleted if there is no intended further use. The following is an example scenario where one may wish to NOT delete the image builder after completion.

* Use the Create Image form to create an image\
     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;skip installing at least one application\
     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;do not snapshot the image builder\
     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;do not delete the image builder
* Use the AWS Conosle access the image builder through the AppStream 2.0 service.\
     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;do additional advanced configuration on the image builder\
     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;log out of the image builder
* Use the Create Image form to create the final image\
     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;add the last application(s)\
     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;snapshot the image builder\
     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;optionally delete the image builder

When all fields on the form are completed as needed, click "Create Image" to complete the image creation process. Click "Cancel" at anytime to abort and return to the image list.

## Image Details

The image details page provides information about a selected image. To get to image details, start at the [Appstream Images list](#appstream-images-introduction), find the desired image and click the Image Details button.

### General Details

**Platform**: The OS platform used for the image.\
**Created**: The date and time the image was created.\
**Dynamic Catalogs Enabled**: Yes or No depending on the whether the image is created with the dynamic catalogs feature enabled.

### Applications

This is a simple section which lists any applications installed on the image including the icon, the id in the application repo, and the name of the application.

### Sharing

This section lists the Account Ids of any account with which the image is shared. The sharing section also provides two controls.

**Share Image**: Click this button to share the image with another AWS Account. A dialog will appear which accepts a twelve digit AWS Account Id. Simply type the account Id (numbers only, no space or dashes) and click Share Image within the dialog (or Cancel to abort).

**Revoke Access**: If the image is shared with one or more other accounts, the account Id of each account will be displayed along with a Revoke Access button. Click the Revoke Access button then click the Revoke Access button within the confirmation dialog to remove the shared access (Cancel will abort the operation).

### Clone Image

The details page provides one final control, a Clone Image button. Clicking this button will bring one to the [Create Image](#creating-appstream-images) form.

There are a couple of things to keep in mind when cloning the image.

1. The clone must have a unique name.
2. An Image Builder Instance Type must be selected.
3. At least one additional application will need to be selected for the image.
4. Base Image will not display the image to be cloned however there is no need to set it. The image to be cloned will be used as the base image.

When the form is complete, click Create Image to create the clone or Cancel to abort.

## Deleting Appstream Images

### Prerequisite

It is highly recommended to stop and delete any [fleet](/sidebarAppStreamFleets.md) based on the image. Attempting to delete an image with an existing fleet based on that image will only delete the image record and any fleet records from the solution. It will **NOT** delete the actual fleets or images from Appstream 2.0. If this occurs, one must access the Appstream 2.0 service directly from either the AWS CLI or AWS Console to delete these.

### Deleting an Image

Simply click the Delete Image button. A confirmation dialog will appear. Click the Delete Image button in the confimation dialog to complete the process. Click Cancel to abort.

