---
id: dynamic-catalog-details
title: Dynamic Catalog Details
sidebar_label: Dynamic Catalog Details
---

Details for a dynamic catalog are found by clicking the *Details* button for the desired catalog on the *Dynamic Catalogs* page within the solution. From this view, one can share and revoke active directory (AD) group access to the set of applications provided by the dynamic catalog. *Note*: Dynamic catalogs do not work as a *DENY* effect. If a group is granted access to an application view any one dynamic catalog, all members of that group will be granted access to that application.

### Applications
This is just a simple list of applications contained in the catalog including each application's *Icon*, *Id* within the solution and *Name*.

### Access
Access includes the following details.
**Id**: The identifier of an AD group with which the dynamic catalog is shared. All members of this group will have access to the *Applications* contained in the catalogs.
**Name**: The friendly name of the AD group.
**Revoke Access**: Click this button to remove this group from the list of groups which have access to the dynamic catalog. Click *Revoke Access* in the confirmation dialog to complete the operation or *Cancel* to abort.

### Granting Access to a Dynamic Catalog
1. In the *Access* section of the dynamic catalog's details page, click *Grant Access*. 
2. A dialog will appear with a single drop down. Select the group to which the access should be granted.
3. Click *Grant Access* to complete the operation or *Cancel* to abort.