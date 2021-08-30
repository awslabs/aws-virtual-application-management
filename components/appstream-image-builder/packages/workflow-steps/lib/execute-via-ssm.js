/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import AWS from 'aws-sdk';

const OutputSelectionMarker = '--- output ---';

const remotePSCommand = ({ imageBuilderID, domain, domainCredentialsArn, script, _ou }) => {
  const fullScript = `
    $imageBuilderIP = (Get-APSImageBuilderList | ? {$_.Name -eq "${imageBuilderID}"}).NetworkAccessConfiguration.EniPrivateIpAddress 
    $username = (Get-SECSecretValue -SecretId ${domainCredentialsArn} -Select SecretString | ConvertFrom-Json).username
    $user = "$username@${domain}"
    $pass = (Get-SECSecretValue -SecretId ${domainCredentialsArn} -Select SecretString | ConvertFrom-Json).password | ConvertTo-SecureString -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential ($user,$pass)
    $so = New-PSSessionOption -SkipCACheck -SkipCNCheck -SkipRevocationCheck
    $session = New-PSSession -ComputerName $imageBuilderIP -UseSSL -Credential $cred -SessionOption $so
    $result = Invoke-Command -ScriptBlock { ${script} } -Session $session
    $result
    Write-Host "${OutputSelectionMarker}"
  `;
  return fullScript;
};

const imageBuilderInstallViaSSM = async ({
  instanceID,
  imageBuilderID,
  workBucket,
  domain,
  domainCredentialsArn,
  applicationExePath,
  script,
  ou,
}) => {
  let fullScript = remotePSCommand({ imageBuilderID, domain, domainCredentialsArn, script, ou });
  fullScript += `
    $imResult = $result.IMOutput -join "\r\n" | ConvertFrom-Json
    if ($imResult.status -ne 0) {
      $imResult | ConvertTo-Json

      if ($result.PType -eq "choco" -And $result.ChocoStatus -And $result.ChocoStatus -ne 0) {
        $result.ChocoOutput -join "\r\n"
        Exit 1
      }

      if ($result.PType -eq "powershell" -And [string]::IsNullOrWhiteSpace($result.PSResult)) {
        Exit 1
      }

      Exit 1
    }

    if (!$result.InstalledExe) {
      "Installation failed, ${applicationExePath} not found."
      Exit 1
    }
  `;
  return executeViaSSM({ instanceID, script: fullScript, workBucket, aws: { sdk: AWS } });
};

const imageBuilderCommandViaSSM = async ({
  instanceID,
  imageBuilderID,
  workBucket,
  domain,
  domainCredentialsArn,
  script,
  ou,
}) => {
  const fullScript = remotePSCommand({ imageBuilderID, domain, domainCredentialsArn, script, ou });
  return executeViaSSM({ instanceID, script: fullScript, workBucket, aws: { sdk: AWS } });
};

const executeViaSSM = async ({ instanceID, script, logBucket, aws }) => {
  const params = {
    DocumentName: 'AWS-RunPowerShellScript',
    CloudWatchOutputConfig: { CloudWatchOutputEnabled: true },
    OutputS3BucketName: logBucket,
    OutputS3KeyPrefix: 'ssm',
    InstanceIds: [instanceID],
    Parameters: {
      commands: [`${script}`],
      executionTimeout: ['18000'],
    },
  };

  const ssm = new aws.sdk.SSM();
  const res = await ssm.sendCommand(params).promise();
  return res.Command.CommandId;
};

export { imageBuilderCommandViaSSM, imageBuilderInstallViaSSM, executeViaSSM, OutputSelectionMarker };
