---
id: image-details
title: Image Details
sidebar_label: Image Details
---

The image details page provides information about a selected image. To get to image details, start at the [Appstream Images list](introduction), find the desired image and click the *Image Details* button.

## General Details

- **Platform**: The OS platform used for the image.
- **Created**: The date and time the image was created.
- **Dynamic Catalogs Enabled**: Yes or No depending on the whether the image is created with the dynamic catalogs feature enabled.

## Applications

This is a simple section which lists any applications installed on the image including the icon, the id in the application repo, and the name of the application.

## Sharing
This section lists the Account Ids of any account with which the image is shared. The sharing section also provides two controls.

1. **Share Image**: Click this button to share the image with another AWS Account. A dialog will appear which accepts a twelve digit AWS Account Id. Simply type the account Id (numbers only, no space or dashes) and click *Share Image* within the dialog (or *Cancel* to abort).

2. **Revoke Access**: If the image is shared with one or more other accounts, the account Id of each account will be displayed along with a *Revoke Access* button. Click the *Revoke Access* button then click the *Revoke Access* button within the confirmation dialog to remove the shared access (*Cancel* will abort the operation).

## Clone Image

The details page provides one final control, a *Clone Image* button. Clicking this button will bring one to the [Create Image](create-image) form.

There are a couple of things to keep in mind when cloning the image.

1. The clone must have a unique name.
2. An *Image Builder Instance Type* must be selected.
3. At least one *additional* application will need to be selected for the image.
4. *Base Image* will not display the image to be cloned however there is no need to set it. The image to be cloned will be used as the base image.

When the form is complete, click *Create Image* to create the clone or *Cancel* to abort.