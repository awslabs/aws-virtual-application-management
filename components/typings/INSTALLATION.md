# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1.  Add this component as `typings` GitSubmodule to your project under the `components` directory.
    ```bash
    $ cd $PROJECT_HOME/components
    $ git submodule add <git url to this component> typings
    ```
2.  Install dependencies

    ```bash
    $ cd $PROJECT_HOME
    $ pnpm install -r
    ```

3.  You have installed the `typings` component at this point. You can now reference the type definitions in a consuming JS or TS package. For example if you want to reference the definition package for `@aws-ee/base-services`, add the following to your `package.json`

```
// any package.json
{
  "devDependencies": {
    "@types/aws-ee__base-services": "workspace:*"
  }
}
```
