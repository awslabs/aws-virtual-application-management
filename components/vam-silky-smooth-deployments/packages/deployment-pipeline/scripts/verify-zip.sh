#!/bin/bash

# Verify the buildspec is found in the expected location in the .zip archive. The
# most common error is to include the projects root folder as the root of the zip.
# the root folder should be excluded and only the contents of that folder and
# subdirectories should be in the archive.
VAM_ZIP=$1
SHA_256=$2
BUILDSPEC='components/vam-silky-smooth-deployments/packages/deployment-pipeline/config/buildspec/buildspec.yml'

function USAGE
{
  >&2 echo "USAGE: $0 <path to VAM zip archive> <expected SHA256 checksum>"
  exit 1  
}

if [ $# -ne 2 ]; then
  USAGE
fi

if [ ! -f "$VAM_ZIP" ]; then
  USAGE
fi

# there is always a space before the correct path in the unzip output. 
# failing to include the space will cause a match on a line where there is a root folder
# before said path such as "vam/components/...". This is exactly what needs to be detected
# so the customer can abort early.
unzip -lv $VAM_ZIP | grep " $BUILDSPEC" > /dev/null 2>&1 
if [ $? -ne 0 ]; then
  >&2 echo "Deployment buildspec not found at '$BUILDSPEC' in '$VAM_ZIP'. The archive is not usuable. Please report this to the provider of this package."
  exit 1
else
  echo "'$BUILDSPEC' found where expected in '$VAM_ZIP'."
fi

FILESUM=$(shasum -a 256 $VAM_ZIP)
EXPECTED="$SHA_256  $VAM_ZIP"

if [ "$FILESUM" != "$EXPECTED" ]; then
 >&2 echo "WARNING: Checksum of '$VAM_ZIP' does not match '$EXPECTED'. Actual checksum: '$FILESUM'. Please report this to the provider of this package."
 exit 1
else
  echo "Checksum of '$VAM_ZIP' matches '$SHA_256'. It is ok to proceed."
fi
