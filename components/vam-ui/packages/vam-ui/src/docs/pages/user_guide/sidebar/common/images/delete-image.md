---
id: delete-image
title: Deleting Appstream Images
sidebar_label: Delete Image
---

The *Delete Image* control is available for each image on the [*Appstream Images*](introduction.md) page. 

### Prerequisite
It is highly recommended to stop and delete any [fleet](../fleets/introduction) based on the image. Attempting to delete an image with an existing fleet based on that image will only delete the image record and any fleet records from the solution. It will **NOT** delete the actual fleets or images from Appstream 2.0. If this occurs, one must access the Appstream 2.0 service directly from either the AWS CLI or AWS Console to delete these.

### Deleting an Image
Simply click the *Delete Image* button. A confirmation dialog will appear. Click the *Delete Image* button in the confimation dialog to complete the process. Click *Cancel* to abort.

