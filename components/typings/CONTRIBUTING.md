# Contributing

If you want to add typings for a package, start by auto-generating typings for it by running these commands:
```
cd $PACKAGE_ROOT
pnpx tsc lib/index.js --declaration --allowJs --emitDeclarationOnly --outDir tempTypes
```

Then create a new package in the `typings` component, following these conventions:
Assuming, the original package is called `@aws-ee/original-package`,

1. Create a folder under `typings/packages` called `original-package`
2. Create a `package.json` and (important!) set the name to `@typings/aws-ee__original-package`
3. Set other configurations in the new `package.json` according to the conventions in other existing typing packages.
4. Copy the auto-generated typings from earlier (`tempTypes`) into this package under `lib/`.

The auto-generated definitions are not very good because the relevant information is simply not there in the original sources. However, using them as a starting point and iterating on them is a shortcut to getting started.