$Installer = "https://dl.google.com/tag/s/appguid%3D%7B8A69D345-D564-463C-AFF1-A69D9E530F96%7D%26iid%3D%7BA74B1184-9779-A4E1-3E9D-4C2B07D093E7%7D%26lang%3Den-GB%26browser%3D3%26usagestats%3D1%26appname%3DGoogle%2520Chrome%26needsadmin%3Dprefers%26ap%3Dx64-stable-statsdef_1%26installdataindex%3Dempty/update2/installers/ChromeSetup.exe"
Invoke-WebRequest $Installer -OutFile installer.exe
Start-Process -FilePath installer.exe -Args "/silent /install" -Verb RunAs -Wait
