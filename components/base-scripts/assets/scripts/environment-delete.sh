#!/bin/bash
set -e

cd "$(dirname "${BASH_SOURCE[0]}")"
# shellcheck disable=SC1091
[[ $UTIL_SOURCED != yes && -f ./util.sh ]] && source ./util.sh

# Install
install_dependencies "$@"

function componentRemove() {
  local COMPONENT_DIR=$1
  local COMPONENT_NAME=$2

  pushd "$SOLUTION_DIR/$COMPONENT_DIR" > /dev/null
  printf "\nRemoving component: %s ...\n\n" "$COMPONENT_NAME"
  $EXEC sls remove -s "$STAGE"
  printf "\nRemoved component: %s successfully \n\n" "$COMPONENT_NAME"
  popd > /dev/null
}

function removeCfLambdaAssociations() {
  local distributionId=$(getStackOutput web-infra CloudFrontId)
  printf "\n-> Checking Edge Lambda Associations in Cloudfront Distribution $distributionId ..."

  # Retrieve distribution configuration
  local response=$($awscli cloudfront get-distribution-config --id "$distributionId" | jq '.')

  # Keep ETag for later, and save up-to-date configuration with no Lambda associations in a temporary json file
  local ETag=$(jq -r '.ETag' <<<$response)
  local distributionConfig=$(jq --sort-keys '.DistributionConfig' <<<$response)
  local distributionConfigUpdate=$(jq '.DefaultCacheBehavior.LambdaFunctionAssociations = { "Quantity": 0 }' <<<$distributionConfig | jq --sort-keys '.CacheBehaviors.Items[].LambdaFunctionAssociations = { "Quantity": 0 }')

  if [[ "$distributionConfig" != "$distributionConfigUpdate" ]]; then
    printf "\nAssociations are prensent; removing them..."

    tempCfConfig=$(mktemp -p $tmpDir --suffix=.json)
    echo "$distributionConfigUpdate" >$tempCfConfig

    # Update Cloudfront Distribution
    cmd=$($awscli cloudfront update-distribution --distribution-config file://$tempCfConfig --id $distributionId --if-match $ETag)
    printf "Done !"
  else
    printf "\nAssociations are not prensent; nothing to do..."
  fi
}

function emptyS3Bucket() {
  set +e
  local bucket=$1
  local delete_option=$2
  printf "\n- Emptying bucket $bucket ... "

  # Remove Versions for all objects
  versions=$($awscli s3api list-object-versions --bucket $bucket | jq '.Versions')
  let count=$(echo $versions | jq 'length')-1
  if [ $count -gt -1 ]; then
    for i in $(seq 0 $count); do
      key=$(echo $versions | jq .[$i].Key | sed -e 's/\"//g')
      versionId=$(echo $versions | jq .[$i].VersionId | sed -e 's/\"//g')
      $awscli s3api delete-object --bucket $bucket --key $key --version-id $versionId
    done
  fi

  # Remove Markers
  markers=$($awscli s3api list-object-versions --bucket $bucket | jq '.DeleteMarkers')
  let count=$(echo $markers | jq 'length')-1
  if [ $count -gt -1 ]; then
    for i in $(seq 0 $count); do
      key=$(echo $markers | jq .[$i].Key | sed -e 's/\"//g')
      versionId=$(echo $markers | jq .[$i].VersionId | sed -e 's/\"//g')
      $awscli s3api delete-object --bucket $bucket --key $key --version-id $versionId
    done
  fi
  printf "Done !"

  if [ $delete_option == "DELETE_AFTER_EMPTYING" ]; then
    printf "\n- Deleting bucket $bucket ... "
    $awscliRegion s3api delete-bucket --bucket $bucket
    printf "Done !"
  fi
  set -e
}

function emptyS3BucketsFromNames() {
  local delete_option=$1
  local buckets_to_remove=("${@:2}")
  local bucket_prefix="-$STAGE-$awsRegionShortName-$solutionName"

  # get a list of _existing_ buckets
  local buckets_found=$($awscli s3api list-buckets --query "Buckets[].Name" | jq '.[]' | sed 's/"//g')
  local buckets_list=(${buckets_found[0]})

  for bucket_to_remove in "${buckets_to_remove[@]}"; do
    for bucket in "${buckets_list[@]}"; do
      # compare to *"$bucket_prefix-$bucket_to_remove" (note the *) to allow for account number in name
      if [[ $bucket == *"$bucket_prefix-$bucket_to_remove" ]]; then
        emptyS3Bucket $bucket $delete_option
      fi
    done
  done
}

function removeSsmParams() {
  printf "\n\n\n---- SSM Parameters"
  local paramNames=(
    "/$STAGE/$solutionName/jwt/secret"
    "/$STAGE/$solutionName/user/root/password"
    # "/$STAGE/$solutionName/github/token"
  )

  for param in "${paramNames[@]}"; do
    printf "\nDeleting '$param'"
    $awscliRegion ssm delete-parameter --name $param && printf "\nDeletion succeeded" || printf "\nDeletion failed"
  done
}


# Ask for confirmation to begin removal procedure
printf "\n\n\n ****** WARNING ******"
printf "\nTHIS COMMAND WILL HELP YOU CLEAN UP YOUR ENVIRONMENT STACKS AND LEAD TO DATA LOSS."
printf "\nAre you sure you want to proceed to the deletion of the resources of the environment [$STAGE] ?"
printf "\nType the environment name to confirm the removal : "
read -r confirmation
if [[ "$STAGE" != "$confirmation" ]]; then
  printf "\n\nConfirmation mismatch. Exiting.\n\n"
  exit 1
fi

printf "\n\nStarting to clear the application for stage [$STAGE] ...\n"

# -- Lambda@edge associations in Cloudfront (if Cloudfront has not been deleted yet)
printf "\n\n\n--- Edge Lambda Associations in Cloudfront Distribution\n"
removeCfLambdaAssociations

# -- UI
##componentRemove "docs" "Docs"  # handled by serverless-s3-remover wiping off the hosting bucket
##componentRemove "ui" "UI"      # handled by serverless-s3-remover wiping off the hosting bucket
componentRemove "post-deployment" "Post-Deployment"
componentRemove "edge-lambda" "Edge-Lambda"
componentRemove "backend" "Backend"
componentRemove "web-infra" "Web-Infra"


# -- Deployment buckets
buckets=("artifacts")
emptyS3BucketsFromNames "DELETE_AFTER_EMPTYING" ${buckets[@]}

# -- SSM parameters
removeSsmParams

printf "\n\n*******************************************************************"
printf "\n*****     ----- ENVIRONMENT DELETED SUCCESSFULLY  🎉!! -----     *****"
printf "\n*******************************************************************"
printf "\nYou still have to remove the following elements :"
printf "\n  -[Edge lambda]:"
printf "\n     These are replicated functions. Their replicas will now be"
printf "\n     automatically deleted. Then the functions can be manually"
printf "\n     deleted (in 1 hour) at https://console.aws.amazon.com/lambda"
printf "\n\n\n"
