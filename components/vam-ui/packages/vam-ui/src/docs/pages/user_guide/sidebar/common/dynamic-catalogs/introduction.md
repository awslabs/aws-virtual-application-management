---
id: introduction
title: Dynamic Catalogs Introduction
sidebar_label: Introduction
---

Dynamic Catalogs allow an administrator to limit access to one or more applications served by a fleet to the specific active directory (AD) group(s) he or she chooses. Dynamic Catalogs are created by clicking on the *Create Dynamic Catalog* button (see [Creating a Dynamic Catalog](create-dynamic-catalog)). Once a catalog is created, it may be shared with one or more AD groups on that catalogs [details page](dynamic-catalog-details).

### Prerequisites
- Dynamic Catalogs is only available if the solution is deployed to an existing Active Directory (AD) environment. (Administrators should review the solution README.md for more details on deploying to an existing AD environment.)
- To utilize dynamic catalogs, the feature must be enabled on the image from which a fleet is generated at the time the image is created.
- Dynamic Catalogs are configured on Fleets so a fleet must be created from a dynamic catalogs enabled image before a dynamic catalog may be configured.
- When creating a fleet for dynamic catalog usage, the fleet should be set up for streaming applications, not the desktop.

### General Details
- **Id**: The Id given during dynamic catalog creation.
- **Appstream Fleet**: The fleet to which the dynamic catalog is assigned.
- **Applications**: The applications contained within the dynamic catalog.
- **Details**: Click this button to see more details on the catalog. This is also where catalogs are shared with AD groups.
- **Test Catalog**: This button is intended to test the catalog settings. It is not currently implemented.
- **Delete Catalog**: Click this button to delete the catalog.