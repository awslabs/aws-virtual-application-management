---
id: fleet-details
title: Fleet Details
sidebar_label: Fleet Details
---

One finds the Fleet Details page for a given fleet by going to the [Fleets](introduction) page, finding the desired fleet on that page and clicking the *Fleet Details* button. The *Fleet Details* button is available for every fleet in the solution.

The Fleet details page provides several pieces of information about the fleet including [general details](#general), [capacity details](#capacity), [image details](#appstream-image), and [access details](#access).

### General

These are general details about the fleet.

- **Created**: The date and time at which the fleet was created.
- **Status**: The current status of the fleet (*Stopped*, *Starting*, *Running*, or *Stopping*).
- **Instance Type**: The type of EC2 instance used for each instance in the fleet. Specific details on EC2 instance types can be found [here](https://aws.amazon.com/ec2/instance-types/).
- **Fleet Type**: *Always On*, a fleet in which all instances are always running even when no users are using them, or *On Demand*, a fleet in which instances only run while users are streaming applications. Additional details on fleet types are available [here](https://docs.aws.amazon.com/appstream2/latest/developerguide/managing-stacks-fleets.html#fleet-types)
- **Maximum session duration**: The maximum time in minutes which a user may stay connected to a particular fleet instance.
- **Disconnect timeout**: This is the amount of time in minutes which a session remains open after a user disconnects. If the user attempts to reconnect before the disconnect timeout expires, the user will be connected to his or her previous session. Note: if a user uses *End Session* or *Logout* on the Appstream 2.0 toolbar, the disconnect timeout will not apply.
- **Idle disconnect timeout**: This is the amount of time in minutes a user can remain idle, no keyboard or mouse input, before the user is disconnected from his or her session. If the user reconnects before the *Disonnect timeout* has expired, the user will be reconnected to his or her previous session.

### Capacity

These are details which describe capacity and current usage of the fleet.

- **Desired**: The number of instances desired in the fleet.
- **Running**: The number of instances which are actually running in the fleet.
- **In Use**: The number of running instances which are currently being used.
- **Available**: The number of instances which are available to the fleet users.

### Appstream Image

These are some general details about the underlying image from which fleet instances are launched. For more specific details about the image, click the *Image Details* button. The [image details](../images/image-details) page in this documentation provides more information about the image details page.

#### General Details
- **Platform**: The platform on which the image is runnning.
- **Created**: The date and time the image was created.

#### Applications
This section renders a list of applications installed on the image including each application's *Name*, *Id*, and *Icon* as listed on the [Applications Page](../applications/introduction).

### Access
This section details which domain groups have access to the fleet, and allows one to grant or revoke access to the fleet.

To grant access, click the *Grant Access* button, select a domain group from the drop down in the displayed dialog and click *Grant Access* or *Cancel* to abort.

Similarly, to revoke access, find the group and click *Revoke Access*. Click *Revoke Access* in the confirmation dialog to complete the operation or *Cancel* to abort.