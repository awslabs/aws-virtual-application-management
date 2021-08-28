# @aws-ee/base-serverless-config-helper

This package provides a helper to conditionally merge configuration fragments at the time of deployment.
This allows conditionals in serverless.yml - for example - before serverless framework generates CFN template.

## To use this plugin
- import it in your project

```bash
$ pnpm add @aws-ee/base-serverless-config-helper --save-dev
```

- declare it in plugins section of serverless.yml

```
...
plugins:
  ...
  - '@aws-ee/base-serverless-config-helper'
  ...
```

- Populate entries in custom/fragments section in serverless.yml

```
custom:
  ...
  fragments:
    - condition: $(eq(${self:custom.settings.flag}, 'blue'))
      fragment:
        provider:
          endpointType: PRIVATE
    - condition: $(neq(${self:custom.settings.flag}, 'red'))
      fragment:
        provider:
          variant: IMPLICIT
```

## Functionality
Define fragments under custom/fragments in serverless.yml

Specify the following settings for each fragment to potentially inject:
  - condition: a conditional expression that evaluates to true or false
  - description: a description (optional)
  - fragment: the fragment to be injected when condition above evaluates to true

Conditional expression can make use of the following functions:
  - `eq`: test for equality
  - `neq`: test for inequality
  - `lt`: test for less than
  - `le`: test for less than or equal
  - `ge`: test for greater than or equal
  - `gt`: test for greater than
  - `not`: test for boolean negation
  - `and`: test for boolean conjunction
  - `or`: test for boolean disjunction
  - `identity`: test for boolean identity
