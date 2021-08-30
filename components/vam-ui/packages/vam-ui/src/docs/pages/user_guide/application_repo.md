---
id: application_repo
title: Application Repository
sidebar_label: Application Repository
---

Applications are Windows executables that are installed to an image builder, snapshotted to an AppStream image, and then exposed to end users through AppStream fleets and stacks.

### Adding Applications

Additional Applications can be added to the solution by configuring them in the "Application Repo" bucket. To register an application you will need to provide a metadata file, an icon image and optionally powershell scripts to perform custom installs.

The below is an example of the info.json file that is required. The example below works in conjunction with the "Chocolatey" package manger http://chocolatey.org/.

```json
{
  "packageType": "choco",
  "packageInstall": {
    "chocoPackage": "firefox"
  },
  "applicationName": "firefox",
  "applicationExe": "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe"
}
```

n.b. double backslashes in paths

The icon provided should be named "icon.png" and should have dimensions of 96x96px.

When you have prepared the JSON, Icon and optionally the Powershell scripts they can be uploaded to the appropriate S3 bucket by logging into the AWS Console and navigating to the S3 Service. There should be a bucket with the suffix "application-repo". Within this bucket navigate to the path `/applications/default/`. From there create a new folder with the name of the Application that you are installing. Navigate within and create a folder with the version of the Application you are installing. Upload the info.json, icon.png and any Powershell scripts to this folder.

e.g.

```shell
/applications/default/MyApplication/1.0.0/
    info.json
    icon.png
    install.ps1
```

You can confirm that your Application is available by refreshing the Applications page.

### Powershell Applications

Powershell applications allow you to customise applications to gain flexibility beyond what third-party chocolatey packages may provide. For example, if the script `install.ps1` is placed in the Application Repo alongside an `info.json` that references it, like below, then the powershell code inside `install.ps1` will be run on the Image Builder.

```json title="info.json"
{
  "packageType": "powershell",
  "packageInstall": {
    "script": "install.ps1"
  },
  "applicationName": "google_chrome",
  "applicationExe": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
}
```

```powershell title="install.ps1"
$Installer = "https://dl.google.com/tag/s/appguid%3D%7B8A69D345-D564-463C-AFF1-A69D9E530F96%7D%26iid%3D%7BA74B1184-9779-A4E1-3E9D-4C2B07D093E7%7D%26lang%3Den-GB%26browser%3D3%26usagestats%3D1%26appname%3DGoogle%2520Chrome%26needsadmin%3Dprefers%26ap%3Dx64-stable-statsdef_1%26installdataindex%3Dempty/update2/installers/ChromeSetup.exe"
Invoke-WebRequest $Installer -OutFile installer.exe
Start-Process -FilePath installer.exe -Args "/silent /install" -Verb RunAs -Wait
```

### Additional install media

Any file may be hosted in the Application Repo bucket. To access these files, a powershell installer script must be used. Each file will have to be copied down using AWS S3 powershell cmdlets. The `appstream_machine_role` AWS profile should be used -- it will have read-only access to the app repo bucket.
