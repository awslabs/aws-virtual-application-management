#!/bin/bash

set -ue

if [ $# != 3 ]; then
  echo Syntax:
  echo $0 source-location license-file customer-name
  exit 1
fi

sourceLocation=$1
license=$2
customer=$3

tmpdir=$(mktemp -d)

function cleanup {
  rm -r $tmpdir
}
trap cleanup EXIT

export PATH=$PATH:$CODEBUILD_SRC_DIR_EEProdScriptsArtifact/release-poc-code

localdir=$PWD
pushd $sourceLocation >/dev/null

# remove the .git and ee-internal folders
rm -rf $sourceLocation/{.git,ee-internal}

# remove developer settings
find "$sourceLocation"/main/config/settings -name "*.yml" -type f -not -name ".defaults.yml" -not -name "example*.yml" -exec echo pruning '{}' + -exec rm '{}' +

# add lincense
echo adding license info from "$license"
$CODEBUILD_SRC_DIR_EEProdScriptsArtifact/release-poc-code/add-license-rec "$license" "$customer" "$sourceLocation"/

echo "creating '$customer.zip' "
[ -f "$customer".zip ] && rm "$customer".zip

zip -r -q "$customer".zip *

popd >/dev/null



