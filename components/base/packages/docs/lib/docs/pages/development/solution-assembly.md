---
id: solution-assembly
title: Solution Assembly
sidebar_label: Solution Assembly
---

import useBaseUrl from '@docusaurus/useBaseUrl';

The project is made up of various independently _deployable units_.
Each deployment unit is usually implemented as a separate Serverless Framework Service project.

The project follows the [Component Architecture](/development/component-architecture) to create the solution by
composing various loosely coupled components.
Each component provides a collection of packages required for implementing a given solution functionality or feature.
Implementing a feature may involve assembling various component assets such as adding
new deployment units, inserting new AWS Lambda functions to existing deployment units,
injecting new AWS CloudFormation resources to existing templates, passing additional environment
variables to existing AWS Lambda functions etc.
The process of assembling the component assets to create deployment units is called _Solution Assembly_.

## solution-assemble command

The components are assembled using a custom `solution-assemble` Serverless Framework command to dynamically compose
various deployment units that make up the solution.

The `solution-assemble` command is implemented by the custom
Serverless Framework plugin implementation (`base/packages/serverless-solution-commands/lib/serverless-solution-commands-plugin.js`).
The command itself is implemented using the extension point/plugins mechanism.

The command uses the plugin registry provided by the `@aws-ee/main-assembly` package (i.e., the `main/packages/assembly` package).
The command uses the plugin registry to find all plugins registered against the `assemble` extension point.
The command calls these plugins to collect a list of tasks.
Each task in this list represent a specific unit of work that needs to be performed for assembling each component's assets.
After collecting tasks from each plugin, the command executes these tasks in order to assemble the components.
The result of the _Solution Assembly_ is a set of deployment units created under the `main/.generated-solution/` directory.

<img src={useBaseUrl('img/development_guide/component_architecture/solution-assembly.png')} />

## Component's "assembly" package

Each component contains a special `assembly` package.
The `assembly` package provides a plugin to be used for the `assemble` extension point.
The plugin is a plain JavaScript object containing the `getTasks` method.
The method is expected to return an array of tasks.
Each task is a plain JavaScript function that performs a specific job required for assembling the component.
These tasks include things such as copying new deployment unit directories/files under `main/.generated-solution/`,
injecting new AWS CloudFormation resources to existing templates etc.

As a convention, the `assembly` package of each component organizes the component assets in the following directories:

1. **assets/boilerplate**: Contains the boilerplate code that the component wants to contribute to the project code at top level or under the _main_ directory.
   Component keeps the skeleton versions of certain files in this directory. These files are copied only once during the component _installation_.
   The skeleton files copied to top level directory or under _main_ directory provide a starting point.
   These files may be modified later by the project specific code.
   Examples of such files include the skeleton plugin registry files, example settings yaml files, the skeleton package.json files etc.
   Generally, the files located under the **assets/boilerplate** do not participate in the _Solution Assembly_ process described above.
2. **assets/deployables**: Contains new deployment units the component wants to contribute to the project.
   For example, the `base-rest-api` component contributes the `backend` deployment unit that provides a Serverless Framework
   project responsible for deploying the backend RESTful APIs for project.
3. **assets/overrides**: Contains various file fragments the component wants to contribute to deployable units provided by other components.
   For example, if we are building new `basic-todo-management` component that provides basic functionality for managing simple TODO items,
   we would need to implement additional APIs for TODO items management.
   These APIs could be implemented by writing additional API logic and injecting additional AWS IAM permissions required to implement the APIs to the API Handler Lambda function IAM role
   (provided by the `base-rest-api` component). The component can keep AWS CloudFormation template fragments containing the additional
   IAM permissions required for implementing the TODO items management under the `assets/overrides/backend/` directory.
   The assembly plugin can provide a task to perform the job of merging the files from `assets/overrides/backend/` to the
   files under `.generated-solution/backend` hence allowing the component to inject additional
   AWS CloudFormation resources to the existing AWS CloudFormation template.
   The merging of the AWS CloudFormation templates in such manner is just one of the examples.
   The component can contain other types of assets under the _assets/overrides_ directory as well
   (such as JSON file fragments, other YAML file fragments etc).

## Main "assembly" package

As mentioned above, the `solution-assemble` command that performs the _Solution Assembly_ uses the `@aws-ee/main-assembly` package from the project's [PNPM workspace](https://pnpm.js.org/workspaces/).
As per convention, this package is located at `main/packages/assembly`. The package is expected to export a plain JavaScript object containing `getAssemblyInfo` function.
The custom Serverless Framework plugin that provides the `solution-assemble` command uses this `getAssemblyInfo` function to start the assembly process.
The `getAssemblyInfo` function is expected to return an object containing some information about the directory structure of the project and a `getPluginRegistry` function
that returns an instance of the _Plugin Registry_ mentioned above.

A basic `main/packages/assembly` package is created when you install the `base` component.

If you have project specific assets that you want to inject to deployable units, you can place them in `assets/overrides/<deployment-unit>`
located in this package.
For example, if you want to inject default values for various branding related settings to the user interface deployment unit (i.e., `ui`)
You can place them in `main/packages/assembly/assets/overrides/ui/config/settings/.defaults.yml`.
These settings will be merged to the `main/.generated-solution/ui/config/settings/.defaults.yml` file during the solution assembly.
