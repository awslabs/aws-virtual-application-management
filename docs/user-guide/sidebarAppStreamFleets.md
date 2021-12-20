# Fleets

In the Virtual Application Management (VAM) solution, a fleet is a collection of one or more VM instances to which users will connect to utilize the applications selected for the fleet's underlying image. VAM simplifies fleet management by automatically associating each fleet with a Stack of the same name. Stack settings are included as part of the fleet settings.

The fleet page provides the Create Fleet button to access the UI to [create a new fleet](#creating-fleets). The page also provides a list of fleets tracked by the solution. Each listed fleet provides the fleet's name and status (Stopping, Stopped, Starting or Running). Each fleet also provides the following controls:

**Fleet Details**: Opens the [fleet details](#fleet-details) page for the fleet. \
**Start Fleet** (if fleet status is Stopped): Click this button to start the fleet. A confirmation dialog will appear. Click Start Fleet in the confrimation dialog to complete the operation, or Cancel to abort. The fleet should move immediately to the Starting status. When the fleet is ready for use, it will move to the Running status. \
**Test Fleet** (if fleet is Running): Provides a signed streaming link to the fleet. Clicking this will invoke a dialog. Click Copy Link in the dialog to copy the provided link to the clipboard. Follow the link to open a connection to an instance within the fleet. Click Done to dismiss the dialog. \
**Stop Fleet** (if fleet is Running or Starting): Click the Stop Fleet button to stop the desired fleet. A confirmation dialog will appear. Click Stop Fleet in the dialog to complete the operation or Cancel to abort. \
**Delete Fleet** (if fleet is Stopped): Click this button to delete the fleet. A confirmation dialog will appear. Click Delete Fleet to complete the operation, Cancel to abort. Note: if the Delete Fleet button is not available for a given fleet, check the fleet's status. Delete Fleet is only available for fleets in the Stopped state. If the fleet is in the Running or Starting state, click Stop Fleet and confirm on the fleet before attempting to delete. If the fleet is in the Stopping status, simply wait for the fleet to move to the Stopped state.
    
## Creating Fleets

The Create Fleet button can be found on the [fleets](#fleets) page. When that button is clicked, the Create Fleet form will be displayed. The user will be asked to fill in the following values.

**Name**: A unique name for the fleet. This will also be the name of an associated stack.\
**Image**: The image from which each fleet instance will be launched.\
**Instance Type**: The EC2 instance type for each instance in the fleet.\
**Fleet Type**: Always On or On Demand. On Demand fleets will allocate instances but they will be stopped while idle.\
**Stream View**: Application to allow users to stream individual applications installed on the image or Desktop to allow users to access the full instance desktop.\
**Maximum session duration**: This is the maximum length in minutes a user session can exist.\
**Disconnect timeout**: This is the amount of time in minutes a user may be disconnected from a session (using a method other than terminate session or logout) before the session will be reset. If the user reconnects before this timeout expires, he or she will be reconnected to the disconnected session.\
**Idle disconnect timeout**: The amount of time in minutes a user may remain idle (no keyboard or mouse input) before the user is disconnected from the session and the countdown to the Disconnect timeout begins.\
**Desired Capacity**: The desired number of instances within the fleet for user to support user sessions.

When the details are complete, click the Create Fleet button. Click Cancel to discard the form values and abort the operation.

## Fleet Details

One finds the Fleet Details page for a given fleet by going to the [Fleets](#fleets) page, finding the desired fleet on that page and clicking the Fleet Details button. The Fleet Details button is available for every fleet in the solution.

The Fleet details page provides several pieces of information about the fleet including [general details](#general), [capacity details](#capacity), [image details](#appstream-image), and [access details](#access).

### General

These are general details about the fleet.

**Created**: The date and time at which the fleet was created.\
**Status**: The current status of the fleet (Stopped, Starting, Running, or Stopping).\
**Instance Type**: The type of EC2 instance used for each instance in the fleet. Specific details on EC2 instance types can be found [here](https://aws.amazon.com/ec2/instance-types/).\
**Fleet Type**: Always On, a fleet in which all instances are always running even when no users are using them, or On Demand, a fleet in which instances only run while users are streaming applications. Additional details on fleet types are available [here](https://docs.aws.amazon.com/appstream2/latest/developerguide/managing-stacks-fleets.html#fleet-types).\
**Maximum session duration**: The maximum time in minutes which a user may stay connected to a particular fleet instance.\
**Disconnect timeout**: This is the amount of time in minutes which a session remains open after a user disconnects. If the user attempts to reconnect before the disconnect timeout expires, the user will be connected to his or her previous session. Note: if a user uses End Session or Logout on the Appstream 2.0 toolbar, the disconnect timeout will not apply.\
**Idle disconnect timeout**: This is the amount of time in minutes a user can remain idle, no keyboard or mouse input, before the user is disconnected from his or her session. If the user reconnects before the Disonnect timeout has expired, the user will be reconnected to his or her previous session.

### Capacity

These are details which describe capacity and current usage of the fleet.

**Desired**: The number of instances desired in the fleet.\
**Running**: The number of instances which are actually running in the fleet.\
**In Use**: The number of running instances which are currently being used.\
**Available**: The number of instances which are available to the fleet users.

### Appstream Image

These are some general details about the underlying image from which fleet instances are launched. For more specific details about the image, click the Image Details button. 

**Platform**: The platform on which the image is running.\
**Created**: The date and time the image was created.\
**Applications**: This section renders a list of applications installed on the image including each application's Name, Id, and Icon as listed on the [Applications Page](/sidebarApplications.md).

### Access

This section details which domain groups have access to the fleet, and allows one to grant or revoke access to the fleet.To grant access, click the Grant Access button, select a domain group from the drop down in the displayed dialog and click Grant Access or Cancel to abort. Similarly, to revoke access, find the group and click Revoke Access. Click Revoke Access in the confirmation dialog to complete the operation or Cancel to abort.
