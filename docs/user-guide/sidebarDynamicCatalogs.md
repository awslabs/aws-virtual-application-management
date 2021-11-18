# Dynamic Catalogs

Dynamic Catalogs allow an administrator to limit access to one or more applications served by a fleet to the specific active directory (AD) group(s) he or she chooses. Dynamic Catalogs are created by clicking on the Create Dynamic Catalog button. Once a catalog is created, it may be shared with one or more AD groups.

**Prerequisites**

* Dynamic Catalogs is only available if the solution is deployed to an existing Active Directory (AD) environment (Administrators should review the solution README.md for more details on deploying to an existing AD environment). 
* To utilize dynamic catalogs, the feature must be enabled on the image from which a fleet is generated at the time the image is created. 
* Dynamic Catalogs are configured on Fleets so a fleet must be created from a dynamic catalogs enabled image before a dynamic catalog may be configured. 
* When creating a fleet for dynamic catalog usage, the fleet should be set up for streaming applications, not the desktop.

**General Details**

**Id**: The Id given during dynamic catalog creation.\
**Appstream Fleet**: The fleet to which the dynamic catalog is assigned.\
**Applications**: The applications contained within the dynamic catalog.\
**Details**: Click this button to see more details on the catalog. This is also where catalogs are shared with AD groups.\
**Test Catalog**: This button is intended to test the catalog settings. It is not currently implemented.\
**Delete Catalog**: Click this button to delete the catalog.
    
## Creating a Dynamic Catalog

To create a dynamic catalog, start by navigating to the Dyanmic Catalogs page within the solution and click the Create Dynamic Catalog button on that page. Continue by following these steps.

1. Click the Create Dynamic Catalog button.
2. Choose a fleet from the AppStream Fleets dropdown and click Select Fleet (*Cancel to abort).
3. Type a name (will be shown as Id in details) for the dynamic catalog.
4. Tick the checkboxes for each application to include in the catalog.
5. Click Create Dynamic Catalog to complete the operation or Cancel to abort.

Once the catalog is created, click the Details button the catalog to view the catalog's details and share it with one or more active directory (AD) groups.

## Dynamic Catalog Details

Details for a dynamic catalog are found by clicking the Details button for the desired catalog on the Dynamic Catalogs page within the solution. From this view, one can share and revoke active directory (AD) group access to the set of applications provided by the dynamic catalog. Note: Dynamic catalogs do not work as a DENY effect. If a group is granted access to an application view any one dynamic catalog, all members of that group will be granted access to that application.

**Applications**

This is just a simple list of applications contained in the catalog including each application's Icon, Id within the solution and Name.

**Access**

Access includes the following details:

**Id**: The identifier of an AD group with which the dynamic catalog is shared. All members of this group will have access to the Applications contained in the catalogs. 
**Name**: The friendly name of the AD group. 
**Revoke Access**: Click this button to remove this group from the list of groups which have access to the dynamic catalog. Click Revoke Access in the confirmation dialog to complete the operation or Cancel to abort.

**Granting Access to a Dynamic Catalog**

1. In the Access section of the dynamic catalog's details page, click Grant Access.
2. A dialog will appear with a single drop down. Select the group to which the access should be granted.
3. Click Grant Access to complete the operation or Cancel to abort.
