#!/bin/bash

set -ue

if [ $# != 3 ]; then
  echo Syntax:
  echo $0 source-location customer-name
  exit 1
fi

sourceLocation=$1
customer=$2

tmpdir=$(mktemp -d)

function cleanup {
  rm -r $tmpdir
}
trap cleanup EXIT

localdir=$PWD
pushd $sourceLocation >/dev/null

# remove the .git folder
rm -rf $sourceLocation/{.git}

echo "creating '$customer.zip' "
[ -f "$customer".zip ] && rm "$customer".zip

zip -r -q "$customer".zip *

popd >/dev/null



