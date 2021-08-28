#!/usr/bin/env bash
set -e

UTIL_SOURCED=yes
export UTIL_SOURCED

# Create a tempdir. In here create temp files when needed with
# tempFile=$(mktemp -p $tmpDir --suffix=.json)
# Do not worry about deleting temp files. Will be automatically cleaned up at script exit.
tmpDir=$(mktemp -d)
#echo created $tmpDir
function cleanupAtExit {
  #echo removing $tmpDir
  rm -rf $tmpDir
}
trap cleanupAtExit EXIT

# https://stackoverflow.com/questions/59895/how-to-get-the-source-directory-of-a-bash-script-from-within-the-script-itself
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"

# This sets STAGE to $1 if present and not null, otherwise it sets stage to
# $STAGE from the environment if present, else it defaults to $USER
STAGE="${1:-${STAGE:-$USER}}"

pushd "${DIR}/.."  > /dev/null
export SOLUTION_ROOT_DIR="${PWD}"
export SOLUTION_DIR="${SOLUTION_ROOT_DIR}/main/solution"
export CONFIG_DIR="${SOLUTION_ROOT_DIR}/main/config"
export INT_TEST_DIR="${SOLUTION_ROOT_DIR}/main/integration-tests"
popd > /dev/null

function init_package_manager() {
  PACKAGE_MANAGER=pnpm
  if ! command -v $PACKAGE_MANAGER; then
    npm install -g pnpm
  fi
  case "$PACKAGE_MANAGER" in
    yarn)
      EXEC="yarn run"
      RUN_SCRIPT="yarn run"
      INSTALL_RECURSIVE="yarn workspaces run install"
      ;;
    npm)
      EXEC="npx"
      RUN_SCRIPT="npm run"
      INSTALL_RECURSIVE=
      ;;
    pnpm)
      EXEC="pnpx"
      RUN_SCRIPT="pnpm run"
      export EXEC RUN_SCRIPT
      INSTALL_RECURSIVE="pnpm recursive install"
      ;;
    *)
      echo "error: Unknown package manager: '${PACKAGE_MANAGER}''" >&2
      exit 1
      ;;
  esac
}

function install_dependencies() {
  init_package_manager

  # Install
  pushd "$SOLUTION_DIR"
  [[ -n "$INSTALL_RECURSIVE" ]] && $INSTALL_RECURSIVE
  popd
}

# Internal function to find in settings files an entry for a given parameter as a regular expression.
function _getSetting() {
  local key=$1
  cat "$CONFIG_DIR/settings/$STAGE.yml" "$CONFIG_DIR/settings/.defaults.yml" 2> /dev/null | (grep "$key" -m 1 || true) |  sed 's/ //g' | cut -d':' -f2 | tr -d '\012\015'
}
# External function to find in settings files an entry for a given parameter
function getSetting() {
  # construct a regular expression from given parameter to insure it is found:
  #  - only at the beginning of line
  #  - not commented out
  #  - not a prefix of another key
  _getSetting "^$1:"
}

# Given a stack (its foldername as a logical name), return its name in sls framework
function getStackName() {
  local logicalStackName=$1
  pushd "$SOLUTION_DIR/$logicalStackName" > /dev/null
  local result=$($EXEC sls info -s "$STAGE" | grep 'stack:' --ignore-case | sed 's/ //g' | cut -d':' -f2 | tr -d '\012\015')
  popd > /dev/null
  echo $result
}

# Given a stack (its foldername as a logical name), and an output key, fetch that valut:
function getStackOutput() {
  local logicalStackName=$1
  local outputKey=$2
  local stackName=$(getStackName $logicalStackName)
  $awscliRegion cloudformation describe-stacks --stack-name "$stackName" --output text --query "Stacks[0].Outputs[?OutputKey==\`$outputKey\`].OutputValue"
}

# fetch a few common settings
solutionName=$(getSetting solutionName)
awsRegion=$(getSetting awsRegion)
awsRegionShortName=$(echo $(_getSetting \'$awsRegion\') | tr -d "'")
awsProfile=$(getSetting awsProfile)
# setup command to invoke AWS sdk
awscli=aws
if [ ! -z $awsProfile ]; then
  awscli="$awscli --profile $awsProfile"
fi
# setup command to invoke regionalized AWS sdk
awscliRegion="$awscli --region $awsRegion"

#echo solutionName: $solutionName
#echo awsRegion: $awsRegion
#echo awsRegionShortName: $awsRegionShortName
#echo awsProfile: $awsProfile
