# User Interface (UI)
Project user interface (UI) code built using [ReactJs](https://reactjs.org/) and [MobX](https://mobx.js.org/README.html) and [MobX-state-tree](https://mobx-state-tree.js.org/intro/philosophy).

## Packaging and deploying

All the commands mentioned below need to be executed from the `main/solution/ui` directory. 
Replace `<stage name>` with appropriate environment name (stage name).

To package locally (to populate `.env.local` only). 

```
$ pnpx sls package-ui  --local=true --stage <stage name>
```

To package for deployment (to populate .env.production and create a build via "npm build")

```
$ pnpx sls package-ui --stage <stage name>
```

To run locally

```
$ pnpx sls start-ui --stage <stage name>
```

To deploy to S3

```
$ pnpx sls deploy-ui --invalidate-cache=true --stage <stage name> 
```

## Useful commands

To list all resolved variables

```
$ pnpx sls print --stage <stage name>
```
