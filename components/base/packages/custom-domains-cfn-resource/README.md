# @aws-ee/base-custom-domains-cfn-resource

Code to support lambda backed custom resources.

##This is how you use it

```
  CertificateRaw:
    # Expects DomainName, Region [optional], Tags [optional]
    # Request/Delete ACM certificate (on delete waits for the certificate to not be in use)
    # Does not trigger/manage any domain name validation
    # Default property is the CertificateArn
    Type: Custom::CertificateRaw
    Condition: UseCustomDomain
    Properties:
      ServiceToken: ${self:custom.settings.acmCertificateCustomResourceLambdaArn}
      DomainName: ${self:custom.settings.domainName}
      Region: us-east-1
      Tags: ${self:provider.stackTags}

  CertificateDomainNameValidation:
    # Expects CertificateArn, DomainName, HostedZoneId
    # Manages lifecycle of domain validation records for a domain; fetches validation info from given CertificateArn
    # Default property is the domain name followed by certificate arn, followed by hosted zone id, comma separated
    Type: Custom::DnsValidation
    Condition: UseCustomDomain
    Properties:
      ServiceToken: ${self:custom.settings.acmCertificateCustomResourceLambdaArn}
      CertificateArn: !Ref CertificateRaw
      DomainName: ${self:custom.settings.domainName}
      HostedZoneId: ${self:custom.settings.hostedZoneId}

  Certificate:
    # Expects CertificateArn, Validations
    # On create/update waits for certificate being issued, no-op on delete.
    # Default property is Certificate Arn
    Type: Custom::Certificate
    Condition: UseCustomDomain
    Properties:
      ServiceToken: ${self:custom.settings.acmCertificateCustomResourceLambdaArn}
      CertificateArn: !Ref CertificateRaw
      Validations:
        - !Ref CertificateDomainNameValidation
```
