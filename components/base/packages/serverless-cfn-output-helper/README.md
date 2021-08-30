# @aws-ee/base-serverless-cfn-output-helper

This package provides a helper to automatically inject output entries in a CFN at the time of deployment. This is useful when resoving the value of such entries requires non-trivial actions, such as querying AWS.

## To use this plugin
- import it in your project

```bash
$ pnpm add @aws-ee/base-serverless-cfn-output-helper --save-dev
```

- declare it in plugins section of serverless.yml

```
...
plugins:
  ...
  - '@aws-ee/base-serverless-cfn-output-helper'
  ...
```

- Populate entries in custom/outputInjection section in serverless.yml

```
custom:
  ...
  outputInject:
    explicit:
      - Name: ExampleOutput
        Description: An example of explicit output injection
        Value: ExampleExplicitValue
      ...
    certificate:
      - Name: CertificateArn
        Description: An example of output injection resulting from resolving an ACM certificate by domain name
        DomainName: example.domain.name
      ...
```

## Functionality
### Explicit injection
This can be achieved via existing serverless framework functionality, but is added here for completeness.

- Define it under custom/outputInject/explicit in serverless.yml
- Specify the following settings for each output entry to be injected:
  - __Name__: The name of the entry to be injected
  - __Value__:  The value of the entry to be injected
  - __Description__: An optional description to document the entry to be injected 
  
### Inject certificate ARN given a certificate domain name
This scans all certificates in the current AWS account and if a match is found, the ARN of the match is injected. If no match is found, the entry is not injected.

- Define it under custom/outputInject/certificate in serverless.yml
- Specify the following settings for each output entry to be injected:
  - __Name__: The name of the entry to be injected
  - __DomainName__:  The domain name value to use when identifying a certificate
  - __Description__: An optional description to document the entry to be injected 
  
