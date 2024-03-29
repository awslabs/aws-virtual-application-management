#!/bin/bash
set -e

pushd "$(dirname "${BASH_SOURCE[0]}")" > /dev/null
# shellcheck disable=SC1091
[[ $UTIL_SOURCED != yes && -f ./util.sh ]] && source ./util.sh
popd > /dev/null

# Install
install_dependencies "$@"

function disableStats {
  COMPONENT_DIR=$1
  pushd "$SOLUTION_DIR/$COMPONENT_DIR" > /dev/null
  # Disable serverless stats (only strictly needs to be done one time)
  $EXEC sls slstats --disable -s "$STAGE"
  popd > /dev/null
}

function componentDeploy {
  COMPONENT_DIR=$1
  COMPONENT_NAME=$2

  pushd "$SOLUTION_DIR/$COMPONENT_DIR" > /dev/null
  printf "\nDeploying component: %s ...\n\n" "$COMPONENT_NAME"
  $EXEC sls deploy -s "$STAGE"
  printf "\nDeployed component: %s successfully \n\n" "$COMPONENT_NAME"
  popd > /dev/null
}

disableStats "web-infra"
componentDeploy "web-infra" "Web-Infra"
componentDeploy "backend" "Backend"
componentDeploy "edge-lambda" "Edge-Lambda"
componentDeploy "post-deployment" "Post-Deployment"

# We now need to invoke the post deployment lambda (we can do this locally)
printf "\nInvoking post-deployment steps\n\n"
pushd "$SOLUTION_DIR/post-deployment" > /dev/null
$EXEC sls invoke -f postDeployment -s "$STAGE"
popd > /dev/null

# Deploy solution UI
pushd "$SOLUTION_DIR/ui" > /dev/null

# first we package locally (to populate .env.local only)
printf "\nPackaging solution UI\n\n"
$EXEC sls package-ui --local=true -s "$STAGE"
# then we package for deployment
# (to populate .env.production and create a build via "npm build")
$EXEC sls package-ui -s "$STAGE"

printf "\nDeploying solution UI\n\n"
# Deploy it to S3, invalidate CloudFront cache
$EXEC sls deploy-ui --invalidate-cache=true -s "$STAGE"
printf "\nDeployed solution UI successfully\n\n"
popd > /dev/null

# Deploy docs UI to S3
pushd "$SOLUTION_DIR/docs" > /dev/null
# Package for deployment
printf "\nPackaging solution Docs\n\n"
$EXEC sls package-ui --local=true -s "$STAGE"
$EXEC sls package-ui -s "$STAGE"

# Deploy it to S3, invalidate CloudFront cache
printf "\nDeploying solution Docs\n\n"
$EXEC sls deploy-ui-s3 --invalidate-cache=true -s "$STAGE"
printf "\nDeployed Docs successfully\n\n"
popd > /dev/null

printf "\n----- ENVIRONMENT DEPLOYED SUCCESSFULLY 🎉 -----\n\n"
pushd "$(dirname "${BASH_SOURCE[0]}")" > /dev/null

# shellcheck disable=SC1091
source ./get-info.sh "$@"

popd > /dev/null
