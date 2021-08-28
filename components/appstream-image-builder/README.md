# LTI Consumer keys

## Overview
This component creates and exposes two randomly-generated keys, stored in AWS Secrets Manager, that are intended to be used in an LTI integration.

The solution supports being used as an LTI tool in an external LMS. An administrator must retrieve the value of the primary LTI consumer key using the AWS Console, and supply it as the consumer shared key when configuring the LTI tool.

## Secondary Key and Key Rotation
A secondary key is provided and is intended to be used for key rotation. In the event the primary key becomes compromised or simply too old (see Best Practices), the secondary key can be utilized while the primary key is updated.

## Best Practices
### Key Rotation
The chance of any secret being compromised grows with age. A recommended best practice for stored secrets is to rotate them on a regular basis even if there is no known compromise of the secret. An administrator should create a config rule and either alarm or auto-rotate if the age of a secret exceeds a set threshold such as 90 days. As both secrets in this solution are created effectively simmultaneously, consider setting up the first secret rotation and update to occur after 45 days. Thus secrets will be thereafter regenerated when they reach 90 days with an interval of one of the two secrets updating every 45 days.

It is the responsibility of the administrator to ensure that a key rotation policy is created such that the key is updated periodically.

(http://www.imsglobal.org/spec/lti/v1p3/impl)

### Avoid Duplicate Key Values
Each consumer key is made up of two parts. The first property is the `ltiConsumerKey`, and the second property is the `ltiConsumerSecret`. The `ltiConsumerKey` value is synonymous with a user name while the `ltiConsumerSecret` value is more like a password. __It is important that each `ltiConsumerKey` value is unique.__ If these are set to the same value, VAM will only use the first value provided in authenticating external requests.

# Dynamic Catalog notes
To allow users to connect directly to an AppStream instance and not have to go through the solution, we need to arrange files in S3 in such a way that an appstream instance can figure out by itself what apps it has access to.

The way to do this is to create files in the following form. For every group that is assigned to a dynamic catalog, create a file in S3 called `${stackName}-${groupName}/${dyncatName}`. Inside each of these is a json payload describing which apps belong to this dynamic catalogue.

The session logon script we upload to the appstream instances will have exactly two pieces of information: the current user, and the stack name. From this, we can

a) look up which groups the user belongs to, and for each of these, b) check if any files exist under the s3 path prefix of `${stackName}-${groupName}/`, c) construct a set of applications from each file found.

For example, I have groups `g1` and `g2` assigned to my user `test`, a stack called `dc1`, and two dynamic catalogs, `standard` and `restricted`.

```
2020-12-11 19:14:58        360 dc1-CN=g1,OU=Users,OU=vam-uni,DC=vam-uni,DC=com/standard
2020-12-11 19:16:01        190 dc1-CN=g2,OU=Users,OU=vam-uni,DC=vam-uni,DC=com/restricted
2020-12-11 19:14:58        360 dc1-CN=g2,OU=Users,OU=vam-uni,DC=vam-uni,DC=com/standard
```

When my appstream instance starts, it knows that I am in stack `dc1`, I'm `test`, and from there can find out that I belong to group `g1` (in full notation). It will look for files underneath `dc1-g1/` and find that I'm entitled to the `standard` catalogue, but not `restricted`. `standard` is also given to `g2` members but that's not relevant to me as the `test` user.

# Choco Applications and Solution Generated Images
Chocolatey (https://chocolatey.org) also known as choco is the default package manager used for installing applications on images maintained by the solution. Packages installed by Choco are provided by a third party. The solution does not provide a mechanism to audit packages, install package updates or remove packages if they are revoked. An administrator of the solution is repsonsible for ensuring applications installed on images are kept up to date and removed when no longer valid.

Consider instituting regular audits to ensure packages and their dependencies are regularly kept up to date.