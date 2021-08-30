---
id: local-development
title: Local Development Introduction
sidebar_label: Local Development
---

Once you have deployed the app and the UI (and the Docs), you can start developing locally on your computer.
You will be running a local server that uses the same lambda functions code. To start local development, run the following commands to run a local server (on http://localhost:4000/):

```bash
$ cd .generated-solution/backend
$ pnpx sls offline -s $STAGE
```

Then, in a separate terminal, run the following commands to start the ui server (on http://localhost:3000/) and open up a browser:

```bash
$ cd .generated-solution/ui
$ pnpx sls start-ui -s $STAGE
```

Then, in a separate terminal, run the following commands to start the docs server (on http://localhost:3001/) and open up a browser:

```bash
$ cd .generated-solution/docs
$ pnpx sls start-ui -s $STAGE
```
