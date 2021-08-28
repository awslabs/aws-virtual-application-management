---
id: settings
title: Settings
sidebar_label: Settings
---

The project follows the [Component Architecture](/development/component-architecture) to create the solution by
composing various loosely coupled components.
One of the components is the `base` component. The `base` component provides the core framework of the solution and certain utility packages.
One such utility package is `serverless-settings-helper`.

As a convention, each deployment unit loads settings using a settings loader JavaScript file located at
`main/.generated-solution/<deployment-unit>/config/settings/.settings.js`.
The file loads settings using the `serverless-settings-helper` package.

> See [Solution Assembly](/development/solution-assembly) for details about how deployable units are assembled under `main/.generated-solution`

> **stage**:
> A solution can be deployed to multiple stages (such as dev, qa, preprod, prod etc) within the same AWS Account.
> The `stage` represents the environment name that we want to deploy the solution to.
> For development, it is usual practice to keep the developer's username on the computer as the `stage` name.
> For other environments the `stage` name could be the name of the environment (such as dev, qa, preprod, prod etc).
> The `stage` name forms part of the name when naming all AWS resources the solution deploys. Due to this, the stage name
> should be kept short (usually no longer than 5 characters) and should be alphanumeric.

The settings are loaded by various deployable units following a specific set of conventions as follows.

1. The stage specific settings files have higher precedence over the default files.
2. The deployment unit specific settings files have higher precedence over the top level general settings files.
3. The settings files located outside of the components (e.g., some path under `main`) have higher precedence over the component default settings files.

Due to the above mentioned conventions, the settings are loaded from the following files in the listed order of precedence.
The `<deployment-unit>` below represents a specific deployment unit such as _backend_, _ui_, _post-deployment_ etc.
The `<stage>` below represents a specific environment name such as _dev_, _qa_, _preprod_, _prod_ etc.

The files in the list below are ordered from the highest precedence first to the lowest precedence last.

1. `main/config/settings/<deployment-unit>/<stage>.yml`
2. `main/config/settings/<stage>.yml`
3. `main/.generated-solution/<deployment-unit>/config/settings/.defaults.yml`
   > One can inject to this file from _main/packages/assembly/assets/overrides_ as mentioned in [Solution Assembly](/development/solution-assembly))
4. `main/config/settings/.defaults.yml`
