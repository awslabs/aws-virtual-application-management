# AppStream Images Introduction

The Appstream Images page allows the user to view a list of images which have been created within the solution. It provides the user with a button to create images (see Create New Appstream Images within VAM).

With each images listed, the user will note the following data:

    Image name
    Image status including 'Available', 'Processing' or 'Error'

Each image listing also provides the following actions:

    Details
    Delete Image
    
# Creating Appstream Images

The Create Image page allows the user to fill a form with data necessary in order to create a new Appstream image. The form is accessible by clicking on the Create Image button on the Appstream Image list page. The form requests the following data.
Basic Settings#

    Name: the name of the image to be created. This name must be unique within the account to which the solution is deployed.
    Image Builder Instance Type: this field presents a dropdown with the various instance types available for use with the solution. See Amazon EC2 Instance Types for a comprehensive list of instance types and specifications.
    Applications: This is a list of applications available for an image. Check the box for each application to be installed. At least one new application must be installed on the imgae. If an base image is to be used (advanced), the applications on the base image need not be selected.
    (only if deployed with customer owned AD) Dynamic Catalogs Enabled?: Toggle the Dynamic Catalogs feature on/off. With Dynamic Catalogs, one can limit access to one or more applications on a fleet to a particular Active Directory (AD) group. This feature is only available if one supplies settings at solution deployment time to utilize an existing Active Directory. If utilizing a solution deployed AD, the Dynamic Catalogs are not available.

## Advanced Settings

    Base Images: Here a dropdown will list images which already exist in the solution. Optionally select an image to use as the base image for this image. New applications selected from the list in the form will be added to the base image which will then be used to create the new image.
    Image Builder ID: If a previously used image builder already exists, it will be listed in this drop down. This is similar to utilizing a base image in that the image builder will be used with the settings of the previous task completed on that image builder.
    Snapshot Image Builder: IMPORTANT: if this is turned OFF, no new image will actually be created. The steps will be run, but the snapshot is what completes the image generation process. This should usually be left ON.
    Delete Image Builder: By default the Image Builder is deleted once image generation is complete (whether or not the a snapshot was created). An Image Builder is a running VM and incurs cost and should be deleted if there is no intended further use. The follwoing is an example scenario where one may wish to NOT delete the image builder after completion.
        Use the Create Image form to create an image
            skip installing at least one application
            do not snapshot the image builder
            do not delete the image builder
        Use the AWS Conosle access the image builder through the AppStream 2.0 service.
            do additional advanced configuration on the image builder
            log out of the image builder
        Use the Create Image form to create the final image
            add the last application(s)
            snapshot the image builder
            optionally delete the image builder

When all fields on the form are completed as needed, click "Create Image" to complete the image creation process. Click "Cancel" at anytime to abort and return to the image list.

# Image Details

The image details page provides information about a selected image. To get to image details, start at the Appstream Images list, find the desired image and click the Image Details button.
General Details#

    Platform: The OS platform used for the image.
    Created: The date and time the image was created.
    Dynamic Catalogs Enabled: Yes or No depending on the whether the image is created with the dynamic catalogs feature enabled.

## Applications

This is a simple section which lists any applications installed on the image including the icon, the id in the application repo, and the name of the application.
Sharing#

This section lists the Account Ids of any account with which the image is shared. The sharing section also provides two controls.

    Share Image: Click this button to share the image with another AWS Account. A dialog will appear which accepts a twelve digit AWS Account Id. Simply type the account Id (numbers only, no space or dashes) and click Share Image within the dialog (or Cancel to abort).

    Revoke Access: If the image is shared with one or more other accounts, the account Id of each account will be displayed along with a Revoke Access button. Click the Revoke Access button then click the Revoke Access button within the confirmation dialog to remove the shared access (Cancel will abort the operation).

## Clone Image

The details page provides one final control, a Clone Image button. Clicking this button will bring one to the Create Image form.

There are a couple of things to keep in mind when cloning the image.

    The clone must have a unique name.
    An Image Builder Instance Type must be selected.
    At least one additional application will need to be selected for the image.
    Base Image will not display the image to be cloned however there is no need to set it. The image to be cloned will be used as the base image.

When the form is complete, click Create Image to create the clone or Cancel to abort.

