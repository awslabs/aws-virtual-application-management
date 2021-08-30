---
id: create-fleet
title: Creating Fleets
sidebar_label: Create Fleet
---

The *Create Fleet* button can be found on the [fleets](introduction) page. When that button is clicked, the Create Fleet form will be displayed. The user will be asked to fill in the following values.

- **Name**: A unique name for the fleet. This will also be the name of an associated stack.
- **Image**: The image from which each fleet instance will be launched.
- **Instance Type**: The EC2 instance type for each instance in the fleet.
- **Fleet Type**: *Always On* or *On Demand*. *On Demand* fleets will allocate instances but they will be stopped while idle.
- **Stream View**: *Application* to allow users to stream individual applications installed on the image or *Desktop* to allow users to access the full instance desktop.
- **Maximum session duration**: This is the maximum length in minutes a user session can exist.
- **Diconnect timeout**: This is the amount of time in minutes a user may be disconnected from a session (using a method other than terminate session or logout) before the session will be reset. If the user reconnects before this timeout expires, he or she will be reconnected to the disconnected session.
- **Idle disconnect timeout**: The amount of time in minutes a user may remain idle (no keyboard or mouse input) before the user is disconnected from the session and the countdown to the *Disconnect timeout* begins.
- **Desired Capacity**: The desired number of instances within the fleet for user to support user sessions.

When the details are complete, click the *Create Fleet* button. Click *Cancel* to discard the form values and abort the operation.
