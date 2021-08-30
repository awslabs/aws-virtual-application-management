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

import { StepBase } from '@aws-ee/base-workflow-core';
import { imageBuilderCommandViaSSM } from '../../execute-via-ssm';
import { waitForExecution } from '../../util';

const inPayloadKeys = {
  imageBuilderID: 'imageBuilderID',
  installerHostInstanceID: 'installerHostInstanceID',
};

const outPayloadKeys = {};

const settingsKeys = {
  adDomainName: 'adDomainName',
  ou: 'ou',
  imageBuilderADCredentialsArn: 'imageBuilderADCredentialsArn',
  installerHostWorkBucketName: 'installerHostWorkBucketName',
  dapConfigBucketName: 'dapConfigBucketName',
};

class InstallDynamicCatalogScript extends StepBase {
  async start() {
    const settings = await this.mustFindServices('settings');
    const s3 = await this.mustFindServices('s3Service');

    const adDomainName = settings.get(settingsKeys.adDomainName);
    const imageBuilderADCredentialsArn = settings.get(settingsKeys.imageBuilderADCredentialsArn);
    const installerHostWorkBucketName = settings.get(settingsKeys.installerHostWorkBucketName);
    const dapConfigBucketName = settings.get(settingsKeys.dapConfigBucketName);
    const ou = settings.get(settingsKeys.ou);

    const installerHostInstanceID = await this.payloadOrConfig.string(inPayloadKeys.installerHostInstanceID);
    const imageBuilderID = await this.payloadOrConfig.string(inPayloadKeys.imageBuilderID);

    // Non-dynamic dyncat files are synced as part of deploying the image-builder sdc.
    // What we need to do is interpolate variables in and then copy the main script.ps1 up into the work bucket.
    // Then, create a scheduled task and event log as per the dyncat README.md.
    // It doesn't matter if we overwrite script.ps1 in the bucket, because all image builders share the exact same script.
    // We also have to place a fake app into Agents.json to enable dynamic configuration. (https://aws.amazon.com/blogs/desktop-and-application-streaming/bring-your-app-v-packages-to-appstream-2-0-with-the-dynamic-application-framework/)

    const script = this.dapScript({ dapConfigBucketName, installerHostWorkBucketName });
    await s3.api.putObject({ Bucket: installerHostWorkBucketName, Key: 'dyncat/script.ps1', Body: script }).promise();

    const dyncatFiles = await s3.listObjects({
      bucket: installerHostWorkBucketName,
      prefix: 'dyncat',
    });

    const syncCommands = dyncatFiles
      .map(o => {
        const key = o.key;
        return `Read-S3Object -BucketName ${installerHostWorkBucketName} -Key ${key} -File C:\\temp\\${key} -ProfileName appstream_machine_role`;
      })
      .join('\n');

    const fullScript = `
      # sync files
      Remove-Item -Path C:\\temp\\dyncat -Force -Recurse -ErrorAction SilentlyContinue
      New-Item -Path C:\\temp\\dyncat -Force -Type Directory
      Set-Location -Path C:\\temp\\dyncat
      ${syncCommands}

      # required for group membership check
      Install-WindowsFeature RSAT-ADDS

      # add logon script
      New-EventLog -LogName "EEDAP" -Source "ClientRefresh"
      Register-ScheduledTask -xml (Get-Content "eedap_setup.xml" | Out-String) -TaskName "EEDAP Setup"
      Register-ScheduledTask -xml (Get-Content "eedap.xml" | Out-String) -TaskName "EEDAP"

      # enable dynamic application catalogs
      '{"Agents":[{ "DisplayName": "Photon Agent", "Path": "C:\\\\Program Files\\\\Amazon\\\\Photon\\\\Agent\\\\PhotonAgent.exe"}]}' | Out-File "C:\\ProgramData\\Amazon\\AppStream\\AppCatalogHelper\\DynamicAppCatalog\\Agents.json"
    `;

    const commandID = await imageBuilderCommandViaSSM({
      instanceID: installerHostInstanceID,
      imageBuilderID,
      workBucket: installerHostWorkBucketName,
      domain: adDomainName,
      domainCredentialsArn: imageBuilderADCredentialsArn,
      script: fullScript,
      ou,
    });

    await this.payload.setKey(outPayloadKeys.commandID, commandID);

    return this.wait(5)
      .maxAttempts(3600)
      .until('commandFinished');
  }

  // wait until the execution succeeds
  async commandFinished() {
    const instanceID = await this.payloadOrConfig.string(inPayloadKeys.installerHostInstanceID);
    const commandID = await this.payloadOrConfig.string(outPayloadKeys.commandID);
    const aws = await this.mustFindServices('aws');
    const result = await waitForExecution({ instanceID, commandID, aws, log: (...args) => this.print(args) });
    return result !== null;
  }

  inputKeys() {
    return {
      [inPayloadKeys.imageBuilderID]: 'string',
    };
  }

  outputKeys() {
    return {};
  }

  dapScript({ dapConfigBucketName, installerHostWorkBucketName }) {
    return `
      $currentuser = (get-wmiobject Win32_ComputerSystem).UserName.Split('\\')[1]
      Start-Transcript C:\\Users\\$currentuser\\Documents\\Logs\\log.log

      $bucket = "${dapConfigBucketName}"
      Write-Host $bucket
      $repo_bucket = "${installerHostWorkBucketName}"
      Write-Host $repo_bucket

      Add-Type -Path C:\\temp\\dyncat\\ClassLibrary.dll #Define the full path to the DAF DLL
      Add-Type -Path C:\\temp\\dyncat\\Thrift.dll #Define the full path to the Thrift DLL
      Write-Host "loaded libraries"

      #Establish a connection to the Thirft server, exposed via Named Pipes
      $transport = New-Object -TypeName Thrift.Transport.TNamedPipeClientTransport('D56C0258-2173-48D5-B0E6-1EC85AC67893')
      $protocol = New-Object -TypeName Thrift.Protocol.TBinaryProtocol($transport)
      $client = New-Object -TypeName AppStream.ApplicationCatalogService.Model.ApplicationCatalogService+Client($protocol)
      $transport.open()
      Write-Host "connected transport"

      #Get the current user's SID
      $userSid = (New-Object System.Security.Principal.NTAccount(($currentuser))).Translate([System.Security.Principal.SecurityIdentifier]).value
      Write-Host "sid: $userSid"

      $groups = Get-ADPrincipalGroupMembership -Identity $currentuser
      Write-Host $groups

      # the hardcoded fallback here is for development purposes on an image builder host.
      $stack = if (!$env:AppStream_Resource_Name) { "test1" } else { $env:AppStream_Resource_Name }
      Write-Host "stack: $stack"

      # Sort group apps into normal and magic DC lists. Choose which one to use based on whether
      # there are any normal ones. If so, use those. If none are found, fall back to magic.
      $useMagic = $true
      $normalDcs = @()
      $magicDcs = @()

      $groups | % {
        $group = $_.distinguishedName
        $path = "$stack-$group"
        Write-Host "path: $path"

        # list all dynamic catalog configurations that apply to the current group
        Get-S3Object -BucketName $bucket -Prefix $path -ProfileName appstream_machine_role | % {
          Write-Host $_.Key

          if (!($_.Key -match "magic\\|\\|\\|\\|")) {
            $useMagic = $false
            $normalDcs += $_.Key
          } else {
            $magicDcs += $_.Key
          }
        }
      }

      $dcs = @()
      if ($useMagic) {
        $dcs = $magicDcs
      } else {
        $dcs = $normalDcs
      }

      $apps = @{}

      # Fetch info for each app in each DC
      $dcs | % {
        Read-S3Object -BucketName $bucket -Key $_ -File conf.json -ProfileName appstream_machine_role
        $group = Get-Content -Path conf.json | ConvertFrom-JSON

        $group.applications | % {
          if ($apps[$_.id]) {
            Write-Host "already seen: " $_.id
          } else {
            Read-S3Object -BucketName $repo_bucket -Key $_.infoPath -File $_.id -ProfileName appstream_machine_role
            $info = Get-Content -Path $_.id | ConvertFrom-JSON
            Write-Host $info

            $iconPath = $_.iconUrl | % {$_ -replace '\\\\','/'}
            Write-Host "Fetching icon: $iconPath"
            Read-S3Object -BucketName $repo_bucket -Key $iconPath -File icon -ProfileName appstream_machine_role
            $iconData = [Convert]::ToBase64String((Get-Content -Path icon -Encoding Byte))

            $appList = New-Object -TypeName AppStream.ApplicationCatalogService.Model.Application($_.name, $_.displayName, $info.applicationExe, $iconData)

            $apps[$_.id] = New-Object -TypeName Appstream.ApplicationCatalogService.Model.AddApplicationsRequest($userSid, $appList)
          }
        }
      }

      $apps.Keys | % {
        $r = $client.AddApplications($apps[$_])
        Write-Host $r
      }

      $transport.close()

      Write-Host "added applications"

      Stop-Transcript
      Exit
    `;
  }
}

export default InstallDynamicCatalogScript;
