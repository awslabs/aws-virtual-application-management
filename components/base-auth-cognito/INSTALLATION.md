# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

**NOTE:** The steps below refer to the top level directory containing your project code as "`$PROJECT_HOME`."

1. Add this component as a git submodule named "base-auth-cognito":

    ```bash
    $ cd $PROJECT_HOME/components
    $ git submodule add <git url to this component> base-auth-cognito
    ```

2. Register `assembly` plugin and define settings

    2.1 In `$PROJECT_HOME/main/packages/assembly/package.json`, update the `dependencies`:

    ```json
    "dependencies": {
      // Other dependencies ...
      "@aws-ee/base-auth-cognito-assembly": "workspace:*",
      "@aws-ee/base-auth-cognito-serverless-commands": "workspace:*",
    }
    ```

    2.2 Import and register the `assembly` plugins by updating the `$PROJECT_HOME/main/packages/assembly/lib/plugin-registry.js` file:

      ```javascript
      import baseAuthCognitoAssemblyPlugin from '@aws-ee/base-auth-cognito-assembly';
      ```

      ```javascript
      const extensionPoints = {
        assemble: [
          baseAssemblyPlugin,
          // Other plugins ...
          baseAuthCognitoAssemblyPlugin, // <-- Add this after basePostDeploymentAssemblyPlugin and baseRestApiAssemblyPlugin
        ],
      };
      ```

    2.3 Add the following setting to the top level settings file `$PROJECT_HOME/main/config/settings/$STAGE_NAME.yml` and adjust its values:

    ```yaml
    # ================================ Settings required by base-auth-cognito ===========================================
    # Defines the email addresses of admin users who should be provisioned when Post Deployment
    # runs. Admin details can be passed in a stringified JSON object where each item of the array
    # defines the user's "email", "firstName", and "lastName".
    # Example: [{"email": "admin@example.com", "firstName": "Example", "lastName": "Admin"}]
    adminPrincipals: '[{"email": "admin@example.com", "firstName": "Example", "lastName": "Admin"}]'
    ```

    2.4 (Optional) If federation is required via an external identity provider, add the following settings to the top level settings file `$PROJECT_HOME/main/config/settings/$STAGE_NAME.yml` as well and adjust its values accordingly:

    ```yaml
    # ================================ Optional settings for base-auth-cognito ===========================================
    # Leave all the settings below commented out if you do not want to use
    # AWS Cognito User Pool or SAML 2.0 Identity Federation

    # If a Cognito user pool is setup for the solution, this setting indicates whether native
    # Cognito users should be used or if the Cognito user pool will only be used to federate via
    # other identity providers
    enableNativeUserPoolUsers: true

    # Array of identity provider ids.
    # The usual practice is to keep this same as the domain name of the IdP.
    # For example, when connecting with an IdP that has users "user1@domain1.com", "user2@domain1.com" etc then
    # the id should be set to "domain1.com"
    #
    # If you do not want to connect to SAML 2.0 Identity Provider then leave this setting commented out
    # or set it as empty array as follows.
    fedIdpIds: '[]'

    # Array of identity provider names. This array should be in same order as the "fedIdpIds"
    # Some name for the IdPs. (such as 'com.ee', 'EEAD' etc)
    #
    # If you do not want to connect to SAML 2.0 Identity Provider then leave this setting commented out
    # or set it as empty array as follows.
    fedIdpNames: '[]'

    # Array of identity provider display names. This array should be in same order as the "fedIdpIds"
    # Display name (such as 'Employee Login', 'AD Login' etc). This can be used in UI to login options.
    #
    # If you do not want to connect to SAML 2.0 Identity Provider then leave this setting commented out
    # or set it as empty array as follows.
    fedIdpDisplayNames: '[]'

    # Array of identity provider SAML metadata. This array should be in same order as the "fedIdpIds".
    #
    # If you do not want to connect to SAML 2.0 Identity Provider then leave this setting commented out
    # or set it as empty array as follows.
    #
    # fedIdpMetadatas: '[]'
    #
    # Get the Identity Provider SAML metadata file from IdP administrator and place it under
    # "main/config/settings/post-deployment/saml-metadata/" directory and replace "<idp-metadata-file-name>" below with the
    # name of the file.
    # For example, if you place "FOO.XML" under "main/config/settings/post-deployment/saml-metadata/" with IdP metadata then
    # set the following setting as '["s3://${self:custom.settings.deploymentBucketName}/saml-metadata/FOO.XML"]'
    fedIdpMetadatas: '[]'

    ```

3. Register `backend` plugins for the "`api-handler`" and "`authn-handler`" Lambda functions

    3.1 In `$PROJECT_HOME/main/packages/registry-backend/package.json`, update the `dependencies`:

    ```json
    "dependencies": {
      // Other dependencies ...
      "@aws-ee/base-auth-cognito-backend": "workspace:*",
    }
    ```

    3.2 Import and register the backend `api-handler` plugins by updating the `$PROJECT_HOME/main/packages/registry-backend/lib/api-handler/plugin-registry.js` file:

    ```javascript
    import {
      servicesPlugin as baseAuthCognitoServicesPlugin,
      userManagementPlugin as cognitoUserManagementPlugin,
    } from '@aws-ee/base-auth-cognito-backend/dist/api-handler';
    ```

    ```javascript
    const extensionPoints = {
      'service': [
        baseServicesPlugin,
        baseAuthCognitoServicesPlugin, // <-- Add this
      ],
      'user-management': [
        cognitoUserManagementPlugin, // <-- Add this
      ],
    };
    ```

    3.3 Import and register the backend `authn-handler` plugins by updating the `$PROJECT_HOME/main/packages/registry-backend/lib/authn-handler/plugin-registry.js` file:

    ```javascript
    import {
      servicesPlugin as baseAuthCognitoServicesPlugin,
      userManagementPlugin as cognitoUserManagementPlugin,
    } from '@aws-ee/base-auth-cognito-backend/dist/authn-handler';
    ```

    ```javascript
    const extensionPoints = {
      service: [
        baseServicesPlugin,
        baseAuthCognitoServicesPlugin // <-- Add this
      ],
      'user-management': [
        cognitoUserManagementPlugin // <-- Add this
      ],
    };
    ```

4. Register `post-deployment` plugins

    4.1 In `$PROJECT_HOME/main/packages/registry-post-deployment/package.json`, update the `dependencies`

    ```json
    "dependencies": {
      // Other dependencies ...
      "@aws-ee/base-auth-cognito-post-deployment": "workspace:*"
    }
    ```

    4.2 Import and register the `post-deployment` plugins by updating the `$PROJECT_HOME/main/packages/registry-post-deployment/lib/plugin-registry.js` file:

    ```javascript
    import {
      authenticationProvisionerPlugin as cognitoAuthNProvisionerPlugin,
      servicesPlugin as cognitoAuthServicesPlugin,
      userManagementPlugin as cognitoUserManagementPlugin,
    } from '@aws-ee/base-auth-cognito-post-deployment';
    ```

    ```javascript
    const extensionPoints = {
      'service': [
        baseServicesPlugin,
        // existing plugins
        cognitoAuthServicesPlugin, // <-- Add this
      ],
      'authentication-provisioner': [
        cognitoAuthNProvisionerPlugin, // <-- Add this
      ],
      'user-management': [
        cognitoUserManagementPlugin // <-- Add this
      ],
    };
    ```

5. Register `docs` plugin

    5.1 In `$PROJECT_HOME/main/packages/registry-docs/package.json`, update the `dependencies`

    ```json
    "dependencies": {
      // Other dependencies ...
      "@aws-ee/base-auth-cognito-docs": "workspace:*"
    }
    ```

    4.2 Import and register the `docs` plugins by updating the `$PROJECT_HOME/main/packages/registry-docs/lib/plugin-registry.js` file:

    ```javascript
    import { docsPlugin as baseAuthCognitoDocsPlugin } from '@aws-ee/base-auth-cognito-docs';
    ```

    ```javascript
    const extensionPoints = {
      docs: [
        baseDocsPlugin,
        baseAuthCognitoDocsPlugin, // <-- Add this
        // additional plugins
      ],
    };
    ```

6. Install dependencies

    ```bash
    $ cd $PROJECT_HOME
    $ pnpm install -r --frozen-lockfile
    ```

7. You have installed the `base-auth-cognito` component at this point. After installation of the component you can,

    - Run component assembly to generate solution containing various deployable units.

      ```bash
      $ cd $PROJECT_HOME
      $ pnpx sls solution-assemble
      ```

8. Re-deploy to apply changes:

    - Re-deploy just the backend:

      ```bash
      $ cd $PROJECT_HOME/main/.generated-solution/backend
      $ pnpx sls deploy -s <stage>
      ```

    - Re-deploy just the post-deployment stack:

      ```bash
      $ cd $PROJECT_HOME/main/.generated-solution/post-deployment
      $ pnpx sls deploy -s <stage>
      ```

    - Alternatively, you can deploy the whole solution

      ```bash
      $ pnpx sls solution-deploy --stage $STAGE_NAME
      ```

# Extras

## Fetching the Relying Party Information required for setting up trust on Identity Provider side

- Register serverless `commands` plugins

    - In `$PROJECT_HOME/main/packages/main-commands/package.json`, update the `dependencies`:

      ```json
      "dependencies": {
        // Other dependencies ...
        "@aws-ee/base-auth-cognito-serverless-commands": "workspace:*",
      }
      ```

    - Import and register the serverless commands plugins by updating the `$PROJECT_HOME/main/packages/main-commands/lib/plugin-registry.js` file:

      ```javascript
      import {
        slsCommandsPlugin as baseAuthCognitoCommandsPlugin,
        slsInfoPlugin as baseAuthCognitoInfoPlugin,
      } from '@aws-ee/base-auth-cognito-serverless-commands';
      ```

      ```javascript
      function getPluginsInternal(extensionPoint) {
        switch (extensionPoint) {
          case 'commands':
            return [
              // Other plugins ...
              baseAuthCognitoCommandsPlugin, // <-- Add this
            ];
          case 'info':
            return [
              // Other plugins ...
              webInfraInfoPlugin(),
              backendInfoPlugin(),
              cicdPipelineInfoPlugin(),
              cicdTargetInfoPlugin(),
              baseAuthCognitoInfoPlugin, // <-- Add this
            ];
        }
      }
      ```

- Re-install solution dependencies by running `pnpm i` from `$PROJECT_HOME`

- Run one of the following commands to retrieve relying party info:

  ```bash
  $ pnpx sls solution-relying-party-info --stage $STAGE_NAME
  ```

  ```bash
  $ pnpx sls solution-info --stage $STAGE_NAME
  ```
