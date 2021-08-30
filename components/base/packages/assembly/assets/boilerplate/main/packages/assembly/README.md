This is the main package that is the entry point for the assembly. When you run the `pnpx sls solution-assemble` command, the command looks for the plugin-registry provided by this package.

The package also contains a skeleton assembly plugin implementation for the main solution
- The skeleton plugin provides some basic hooks for the main solution to participate in the solution assembly process that creates the `main/.generated-solution/` by assembling assets provided by various components.
- The plugin merges all `yml` and `json` files added to `assets/overrides` or to any child directory of `assets/overrides` to the corresponding files in the `main/.generated-solution/` directory. 
  For example, if you want to override the default branding related settings in `main/.generated-solution/ui/config/settings/.default.yml`, 
  please add a file `assets/overrides/ui/config/settings/.default.yml` and add various `brand*` settings you want to override. 
  The main assembly plugin will then generate the resulting 
  `main/.generated-solution/ui/config/settings/.default.yml` file by merging the files contributed by all components including the one added to `assets/overrides/ui/config/settings/.default.yml` 
  Similarly if you want to override or add some AWS CloudFormation Resource in `main/.generated-solution/backend/config/infra/cloudformation.yml`, please create `assets/overrides/backend/config/infra/cloudformation.yml` file with the resources you want to override.