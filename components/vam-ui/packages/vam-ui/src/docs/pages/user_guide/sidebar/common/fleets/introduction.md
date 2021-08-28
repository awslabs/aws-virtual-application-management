---
id: introduction
title: Fleets Introduction
sidebar_label: Introduction
---

In the Virtual Application Management (VAM) solution, a fleet is a collection of one or more VM instances to which users will connect to utilize the applications selected for the fleet's underlying image. VAM simplifies fleet management buy automatically assoicating each fleet with a *Stack* of the same name. Stack settings are included as part of the fleet settings.

The fleet page provides the *Create Fleet* button to access the UI to [create a new fleet](create-fleet). The page also provides a list of fleets tracked by the solution. Each listed fleet provides the fleet's name and status (*Stopping*, *Stopped*, *Starting* or *Running*). Each fleet also provides the following controls.

- **Fleet Details**: Opens the [fleet details](fleet-details) page for the fleet.
- (if fleet status is *Stopped*) **Start Fleet**: Click this button to start the fleet. A confirmation dialog will appear. Click *Start Fleet* in the confrimation dialog to complete the operation, or *Cancel* to abort. The fleet should move immediately to the *Starting* status. When the fleet is ready for use, it will move to the *Running* status.
- (if fleet is *Running*) **Test Fleet**: Provides a signed streaming link to the fleet. Clicking this will invoke a dialog. Click *Copy Link* in teh dialog to copy the provided link to the clipboard. Follow the link to open a connection to an instance within the fleet. Click *Done* to dismiss the dialog.
- (if fleet is *Running* or *Starting*): **Stop Fleet**: Click the *Stop Fleet* button to stop the desired fleet. A confirmation dialog will appear. Click *Stop Fleet* in the dialog to complete the operation or *Cancel* to abort.
- (if fleet is *Stopped*) **Delete Fleet**: Click this button to delete the fleet. A confirmation dialog will appear. Click *Delete Fleet* to complete the operation, *Cancel* to abort. Note: if the *Delete Fleet* button is not available for a given fleet, check the fleet's status. *Delete Fleet* is only available for fleets in the *Stopped* state. If the fleet is in the *Running* or *Starting* state, click *Stop Fleet* and confirm on the fleet before attempting to delete. If the fleet is in the *Stopping* status, simply wait for the fleet to move to the *Stopped* state.