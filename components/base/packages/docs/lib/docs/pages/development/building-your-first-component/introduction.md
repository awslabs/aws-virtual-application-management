---
id: introduction
title: Building your first Component
sidebar_label: Introduction
---

Assuming you have read the previous sections in this Development Guide, let's try to build your first Component.
We will build an extremely basic component that lists all Amazon S3 buckets used by the project that this component gets installed to.
The component will provide a simple admin API to list these Amazon S3 buckets.
Let's call this component `project-s3-buckets`.

1. To get started, let's first create a component directory under the `components` parent directory.
   Note that the component can live in its own Git repository and be included here as a Git Submodule as well.
   However, for this exercise, we will create the component locally.

Execute the following command from the root of your project directory.

```bash
mkdir components/project-s3-buckets
```

2. Now let's create a `packages` directory to keep all the NPM packages we develop for this component

```bash
pushd components/project-s3-buckets
mkdir packages
popd
```
