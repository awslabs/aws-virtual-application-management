# @aws-ee/base-auth-cognito-serverless-commands

This package provides `base-auth-cognito` component plugins that contribute new serverless commands and output for existing commands

## Plugins

The following plugins are provided:

- `sls-commands-plugin` - Defines the following serverless commands:
    * `sls solution-relying-party-info` - Displays information for registering Cognito as a relying party within a SAML provider
- `sls-info-plugin` - Adds metadata to the results displayed from the `sls solution-info` command about the Cognito identity provider such as relying party info and OAuth login/logout endpoints
