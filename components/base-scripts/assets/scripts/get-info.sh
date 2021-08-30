#!/bin/bash
set -e
set -o pipefail

pushd "$(dirname "${BASH_SOURCE[0]}")" > /dev/null
# shellcheck disable=SC1091
[[ $UTIL_SOURCED != yes && -f ./util.sh ]] && source ./util.sh
popd > /dev/null

# Setup the execution command
init_package_manager

##
#  Sets the following environment variables containing information about the deployed environment and displays a
#  human friendly summary message containing info about the environment
#
# WEBSITE_URL
# API_ENDPOINT
#
##
function get_info() {
  local root_psswd_cmd="$awscliRegion ssm get-parameters --names /$STAGE/$solutionName/user/root/password --output text --with-decryption --query Parameters[0].Value"
  local api_endpoint=$(getStackOutput backend ServiceEndpoint)
  local website_url=$(getStackOutput web-infra WebsiteUrl)

  export ENV_NAME="${STAGE}"
  export WEBSITE_URL="${website_url}"
  export API_ENDPOINT="${api_endpoint}"

  echo "-------------------------------------------------------------------------"
  echo "Summary:"
  echo "-------------------------------------------------------------------------"
  echo "Env Name       : ${ENV_NAME}"
  echo "Solution       : ${solutionName}"
  echo "Website URL    : ${WEBSITE_URL}"
  echo "Docs URL       : ${WEBSITE_URL}/docs/"
  echo "API Endpoint   : ${API_ENDPOINT}"

  # only show profile and root password when running in an interactive terminal
  if [ -t 1 ] ; then
    [ -z "${awsProfile}" ] || echo "AWS Profile    : ${awsProfile}"
    root_passwd="$(${root_psswd_cmd})"
    echo "Root Password  : ${root_passwd}"
  else
    echo "Root Password  : execute ${root_psswd_cmd}"
  fi
  echo "-------------------------------------------------------------------------"
}

get_info
