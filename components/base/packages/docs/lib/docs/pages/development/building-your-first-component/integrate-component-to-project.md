---
id: integrate-component-to-project
title: Integrate the Component with the Project
sidebar_label: Integrate the Component
---

In this section we will integrate the component with the rest of the project by adding the component plugins to
corresponding extension points in appropriate plugin-registry files.

## Add services and routes (controllers) plugins to the plugin-registry

### Add dependencies

We need to add the [services](/development/building-your-first-component/create-services#write-services-plugin) and
the [routes](/development/building-your-first-component/create-rest-apis#write-routes-plugin) plugins we created
earlier to the `registry-backend` package.

The `registry-backend` package contains the plugin-registry used by the `backend` deployment unit.

- Add the component packages to the `dependencies` in `main/packages/registry-backend/package.json` file.

```json
    "@aws-ee/project-s3-buckets-services": "workspace:*",
    "@aws-ee/project-s3-buckets-rest-api": "workspace:*",
```

### Import plugins

- Import the services and the routes plugins from our component in the `main/packages/registry-backend/lib/api-handler/plugin-registry.js` file.

```javascript
import { servicesPlugin as projectS3BucketsServicesPlugin } from '@aws-ee/project-s3-buckets-services';
import { routesPlugin as projectS3BucketsRoutesPlugin } from '@aws-ee/project-s3-buckets-rest-api';
```

### Add services plugin to the plugin-registry

- Add the `projectS3BucketsServicesPlugin` we created [earlier](/development/building-your-first-component/create-services#write-services-plugin)
  to the `service` extension point in the `main/packages/registry-backend/lib/api-handler/plugin-registry.js` file.

```javascript
'service': [
    // other plugins ...
    projectS3BucketsServicesPlugin, // <-- Add this
    servicesPlugin,
  ],
```

### Add routes plugin to the plugin-registry

- Add the `projectS3BucketsRoutesPlugin` we created [earlier](/development/building-your-first-component/create-rest-apis#write-routes-plugin)
  to the `route` extension point in the `main/packages/registry-backend/lib/api-handler/plugin-registry.js` file.

```javascript
'route': [
    // other plugins ...
    projectS3BucketsRoutesPlugin, // <-- Add this
    routesPlugin,
  ],
```

## Add assembly plugin to the plugin-registry

### Add dependency on the component's assembly package

Finally, let's add the component's [assembly plugin](/development/building-your-first-component/create-assembly-package#write-assembly-plugin)
we created earlier to the project's assembly package plugin-registry.

- Add the component assembly package to the `dependencies` in `main/packages/assembly/package.json` file.

```json
    "@aws-ee/project-s3-buckets-assembly": "workspace:*"
```

### Import the component's assembly plugin

- Import the assembly plugin from our component in the `main/packages/assembly/lib/plugin-registry.js` file.

```javascript
import projectS3BucketsAssemblyPlugin from '@aws-ee/project-s3-buckets-assembly';
```

### Add the plugin to the plugin-registry

- Add the `projectS3BucketsAssemblyPlugin` to the `assemble` extension point in the `main/packages/assembly/lib/plugin-registry.js` file.

```javascript
'assemble': [
    // other plugins ...
    projectS3BucketsAssemblyPlugin, // <-- Add this
    mainAssemblyPlugin,
  ],
```

## Run solution assembly

Now let's install npm dependencies and re-assemble the project.
Run the following command from the root of the project.

> The &lt;stage&gt; in the command below refers to the stage name mentioned the
> [settings](/development/settings) section.

```bash
pnpm install --recursive
pnpx sls solution-assemble --stage <stage>
```
