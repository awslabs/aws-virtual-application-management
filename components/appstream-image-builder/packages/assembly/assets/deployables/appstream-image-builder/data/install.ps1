$GPODir = "$Env:Temp\gpo"

$Domain = "${STAGE}"
$GPOBucket = "${GPO_TEMPLATE_BUCKET}"

Install-WindowsFeature RSAT-ADDS
Install-WindowsFeature GPMC

Remove-Item -Force -Recurse $GPODir -ErrorAction SilentlyContinue
New-Item $GPODir -Type Directory
Push-Location $GPODir
Read-S3Object -BucketName $GPOBucket -Key gpo.zip -File gpo.zip
Expand-Archive -Path gpo.zip

Import-GPO -Path "$Env:Temp\gpo\gpo" -BackupGpoName ngpo -TargetName Imported -CreateIfNeeded
Get-GPO -Name Imported | New-GPLink -target "ou=$Domain,dc=$Domain,dc=com"
Get-GPO -Name Imported | New-GPLink -target "ou=Computers,ou=$Domain,dc=$Domain,dc=com"
gpupdate /force

Pop-Location
