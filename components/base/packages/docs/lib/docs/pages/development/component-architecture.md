---
id: component-architecture
title: Component Architecture
sidebar_label: Component Architecture
---

import useBaseUrl from '@docusaurus/useBaseUrl';

The project follows a component architecture to create the solution by composing various loosely coupled components.

# Component

Component is an abstraction of a specific functionality.
A component provides a collection of packages required for implementing the given solution functionality.
Component can be thought of as a higher-level building block providing a specific functionality.  
Many times, implementing a given functionality requires implementing changes that span across different layers of the solution.
E.g., implementing a TODO list management feature may require making changes to backend APIs and user interface (UI) both.
The component provides packages for all such layers of the solution.  
In this example, the TODO management component would provide packages such as `todo-management-apis` (for backend APIs) and `todo-management-ui` (for user interface) both.

## Anatomy of a component

- **INSTALLATION.md**: Each component contains a markdown instructions file that explains steps required to integrate the component into the project.
- **assembly package**: Each component contains a special `assembly` package that provides various assets required by the component such as AWS CloudFormation templates, AWS CloudFormation template fragments, configuration files, html files, css files etc.
  See [Solution Assembly](/development/solution-assembly) for more details.
- **other packages**: Each component contains various programming language specific packages required for implementing the given functionality related to the component.

## Extension Points, Plugins, and Plugin Registries

Various component packages expose interfaces called _Extension Points_.
_Extension Points_ provide a way to extend the functionality of the component without having to modify the component itself.
Other components and/or solution-specific custom code can provide their own implementations of the _Extension Points_ in form of _Plugins_.
Each component can expose 0 to N _Extension Points_.
Each _Extension Point_ can have 0 to N _Plugin_ implementations.
A special object of type _Plugin Registry_ in each deployable unit contains the information about associations of _Extension Points_ and the corresponding _Plugins_ pertaining to that deployable unit.

<img src={useBaseUrl('img/development_guide/component_architecture/extension_points_n_plugins.png')} />

### Extension Point

An extension point is a name (string) that the component introduces to represent a contract (interface) that other components or custom code can implement to extend the functionality of the component.
The component uses the extension point name to query the plugin registry to find all the plugins registered against that extension point.
The component introducing the extension point makes use of the available plugins such that the component's core functionality can be extended in a decoupled manner.

At the core, the extension points and plugins are one way to implement the [Open-closed principle](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle).

Continuing with the TODO list management example above, a `basic-todo-management` component may provide basic functionality for managing simple TODO items containing `title`, `status`, and `dueDate`.
The component may provide a UI package that displays the list of TODO items and _Add TODO_ button. Clicking on the _Add TODO_ button displays the basic input form with fields `Title` and `Due Date`.
The component can keep the functionality open for extension by introducing an extension point named say `todo-item-fields`.
Before rendering the input screen, the component can call plugins registered against `todo-item-fields` extension point
and give those plugins a chance to render additional input form fields and capture additional information about the TODO item being added.
It would then be possible to build another decoupled component say `todo-management-with-alerts` that provide additional functionality of sending due date alerts to owners
of the TODO items by introducing additional fields such as `owner` and `alertEmail` etc.

### Plugin

A plugin is a plain JavaScript object that provides implementation for one or more methods of a given extension point interface.
A component or project specific custom code interested in extending functionality of some other component provides the plugin implementation.

In the above example of the TODO list management, the `todo-management-with-alerts` component would provide an implementation for the `todo-item-fields`
extension point and implement a plugin method say `getTodoItemFormFields`.

### Plugin Registry

A plugin registry is a plain JavaScript object containing associations of extension point and corresponding plugin implementations. Each deployment unit contains its own plugin registries.
Plugin registries are located in various project specific `main/packages/registry-***` packages.

In its simplest form a typical plugin registry looks like this.

```javascript
const extensionPoints = {
  'extension-point1': [plugin1ForEp1, plugin2ForEp1, pluginNForEp1],
  'extension-point2': [plugin1ForEp2, plugin2ForEp2, pluginNForEp2],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
```
