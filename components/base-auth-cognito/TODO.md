# TODO

- Absorb Cognito-specific logic from `@aws-ee/base-ui`
- Remove `dist/` from `@aws-ee/base-auth-cognito-backend` imports in [./INSTALLATION.md](./INSTALLATION.md) after upgrading to webpack v5 [which respects package.json's "exports" field](https://github.com/webpack/webpack/issues/9509). Also remove "./dist/*" export definitions from the backend [package.json](./packages/backend/package.json)'s which have been added for local UI compatibility.
- While an admin can successfully update a user's email address and Cognito sends out an email verification message, there's nowhere for the user to enter the verification code. Logic will need to be added in the future to check for the `email_verified` claim once a user logs in and prompt them to verify their email if needed.
- Consider disabling users in Cognito when they're marked "inactive."
    - **NOTE**: In this case users will receive an auth failure from Cognito instead of being sent to the app.
- Remove excess code from [attribute-mapper-service.js](./packages/services/lib/attribute-mapper-service.js).
- Simplify logic within [attribute-mapper-service.js](./packages/services/lib/attribute-mapper-service.js), [provider-service.js](./packages/services/lib/provider-service.js), and [user-management-service.js](./packages/services/lib/user-management-service.js) so that user attributes are more closely aligned with the native claims returned by the Cognito user pool.
- Eliminate redundant info provided by [sls-commands-plugin.js](./packages/serverless-commands/lib/sls-commands-plugin.js) and [sls-info-plugin.js](./packages/serverless-commands/lib/sls-info-plugin.js)
- `CognitoProvisionerService` - Delete identity providers from Cognito that were initially setup but were removed during a subsequent Post Deployment execution. (Currently the provider is just disabled in the app client.)
- `CognitoUserManagementService` - Add support for deleting attributes without requiring every attribute to be passed on an update request
