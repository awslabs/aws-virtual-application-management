---
id: test-component-apis
title: Test the Component's APIs
sidebar_label: Test Component APIs
---

import useBaseUrl from '@docusaurus/useBaseUrl';

At this point you have created your first component and integrated the component with the project and re-assembled
the deployment units.

You should be able to deploy the project and test the APIs provided by your component now.

## Deploy the project

```bash
pnpx sls solution-deploy --stage <stage>
```

This will print some information about the project such as the URL of the website.
You can execute the `pnpx sls solution-info --stage <stage>` command to print the same information again.
Note down the `API Endpoint` value. We will need this value to test the API calls.
Navigate to the Website URL and login.

## Test your component APIs

To test your component APIs you need to first login as an administrator to the project's UI and obtain JWT token.
Once you have the token, you can then simply CURL the API or use some REST API testing tool
(such as [Postman](https://www.postman.com/)) to test the APIs. We will use `curl` for this example.

To obtain the JWT token, open Developer Tools of your web browser.
In most web browsers, you can open the developer tools by pressing `Command + Option + I` or by opening `View -> Developer -> Developer Tools`.
Open the `Network` section in the `Developer Tools` to inspect the HTTP calls from the website.  
Click some menu item from the left navigation panel. You should see some calls in the `Network` section in the `Developer Tools` now.
Inspect the calls and copy the `Authorization` HTTP header's value.

<img src={useBaseUrl('img/development_guide/build-your-first-component/copy-token.png')} />

Now you can test the API as follows, we will use `curl` for this example.
You can use any REST APIs testing tool of your choice.

```bash
curl "<api-endpoint>/api/project-buckets"
   -H 'Accept: application/json’
   -H ‘Authorization: <JWT-Token>’
```

- Replace the `<api-endpoint>` and `<JWT-Token>` with the `API Endpoint` and the `Authorization` header values you copied earlier.
