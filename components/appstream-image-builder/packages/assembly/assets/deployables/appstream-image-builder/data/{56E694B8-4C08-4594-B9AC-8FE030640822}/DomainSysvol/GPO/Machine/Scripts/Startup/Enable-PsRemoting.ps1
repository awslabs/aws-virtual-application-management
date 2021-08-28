New-Item -Path C:\temp -Force -Type Directory

#Start Logging activity
Start-Transcript -Path "C:\temp\Enable-PsRemoting-log.txt"

#Parameters for the script
$CertPath = "C:\temp\cert.p7b"
#$BucketParam = "/${STAGE}/vam/InstallerHostWorkBucket"
$imageBuilderName = (Get-APSImageBuilderList -ProfileName appstream_machine_role | Sort-Object CreatedTime -Descending | Select-Object -Index 0).Name

# Create Self-signed certificate for HTTPS Listener
$Hostname = [System.Net.Dns]::GetHostByName($env:computerName).HostName
$Cert = New-SelfSignedCertificate -CertstoreLocation Cert:\LocalMachine\My -DnsName $Hostname
$CertPrefix = "Certificates/" + $imageBuilderName + ".p7b"
Export-Certificate -Cert $Cert -FilePath $CertPath -Type p7b
Import-Certificate -FilePath $CertPath -CertStoreLocation cert:\LocalMachine\Root

# Enable PSRemoting on Image Builder
Remove-Item WSMan:\localhost\Listener\* -Recurse
Enable-PSRemoting -Force
Get-ChildItem WSMan:\Localhost\listener | Where -Property Keys -eq "Transport=HTTP" | Remove-Item -Recurse
New-Item -Path WSMan:\LocalHost\Listener -Transport HTTPS -Address * -CertificateThumbPrint $Cert.Thumbprint -Force
Set-NetFirewallProfile -Profile Domain -Enabled False # XXX it would be preferable to do this in a better way.

#Stop Logging activity
Stop-Transcript
