/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import keys from '../keys';

const ja = {
  values: {
    [keys.APPSTREAM_IMAGE]: 'AppStream イメージ',
    [keys.APPSTREAM_IMAGES]: 'AppStream イメージ',
    [keys.APPSTREAM_IMAGE_SELECTED]: 'アプリストリーム画像が選択されました',
    [keys.APPSTREAM_FLEET_SELECTED]: 'Appstream Fleet Selected',
    [keys.CREATE_IMAGE]: 'イメージを作成',
    [keys.DELETE_IMAGE]: 'Delete Image',
    [keys.DELETE_IMAGE_CONFIRMATION]: "Are you sure you want to delete the Image '%{image}'?",
    [keys.CREATE_DYNAMIC_CATALOG]: '動的カタログを作成する',
    [keys.EMPTY_APPSTREAM_IMAGES]: 'AppStream イメージを作成していません',
    [keys.EMPTY_DYNAMIC_CATALOGS]: '動的カタログを作成していません',
    [keys.DESCRIPTION]: '解説',
    [keys.DYNAMIC_APPLICATION_CATALOGS]: 'Dynamic Catalogs',
    [keys.DYNAMIC_APPLICATION_CATALOGS_ENABLED]: 'Dynamic Catalogs Enabled',
    [keys.YES]: 'Yes',
    [keys.NO]: 'No',
    [keys.DETAILS]: '詳細',
    [keys.PLATFORM]: 'Platform',
    [keys.CREATED]: 'Created',
    [keys.FAILED]: 'Failed',
    [keys.ICON]: 'アイコン',
    [keys.ID]: 'Id',
    [keys.DYNAMIC_CATALOG_CREATED]: '作成された動的カタログ',
    [keys.NAME]: 'ネーム',
    [keys.DATE_TIME_FORMAT]: 'YYYY-MM-DD HH:mm',
    [keys.REVOKE_ACCESS]: 'アクセス権を取り消す',
    [keys.REVOKE_ACCESS_CONFIRMATION]: 'アカウント「%{account}」へのアクセスを取り消してもよろしいですか？',
    [keys.REVOKED]: 'Revoked',
    [keys.REVOKE_SUCCESS]: 'Sharing with account %{accountId} revoked.',
    [keys.APPLICATIONS]: 'アプリケーション',
    [keys.SHARING]: 'シェアリング',
    [keys.SHARED]: 'Shared',
    [keys.SHARE_IMAGE]: 'イメージを共有',
    [keys.SHARE_IMAGE_MESSAGE]: 'AWS account ID:',
    [keys.SHARE_SUCCESS]: 'The image has been shared',
    [keys.ACCOUNT_ID]: 'アカウント Id',
    [keys.NOT_SHARED]: 'このイメージはどのアカウントとも共有されていません。',
    [keys.NOT_SHARED_ANYONE]: 'Not shared with anyone yet.',
    [keys.EMPTY_APPLICATIONS]: 'No Applications have been registered in the solution.',
    [keys.FORM_NAME_IMAGE_PLACEHOLDER]: 'A name for the AppStream Image',
    [keys.FORM_DYNAMIC_CATALOG_NAME_PLACEHOLDER]: '動的カタログの名前',
    [keys.IMAGE_CREATION_SUCCESS]: 'Your image has been submitted for creation.',
    [keys.VIEW_PROGRESS]: 'View Progress',
    [keys.PROCESSING]: 'Processing',
    [keys.AVAILABLE]: 'Available',
    [keys.FLEETS]: 'Fleets',
    [keys.CREATE_FLEET]: 'Create Fleet',
    [keys.EMPTY_APPSTREAM_FLEETS]: 'You have not created any AppStream Fleets',
    [keys.STANDARD]: 'Standard',
    [keys.COMPUTE_OPTIMIZED]: 'Compute Optimized',
    [keys.MEMORY_OPTIMIZED]: 'Memory Optimized',
    [keys.GRAPHICS_OPTIMIZED]: 'Graphics Optimized',
    [keys.IMAGE]: 'Image',
    [keys.INSTANCE_TYPE]: 'Instance Type',
    [keys.IMAGE_BUILDER_INSTANCE_TYPE]: 'Image Builder Instance Type',
    [keys.FLEET_TYPE]: 'Fleet Type',
    [keys.ALWAYS_ON]: 'Always On',
    [keys.ON_DEMAND]: 'On Demand',
    [keys.FORM_NAME_FLEET_PLACEHOLDER]: 'A name for the AppStream Fleet',
    [keys.IMAGE_TO_USE]: 'The AppStream Image to use for this Fleet.',
    [keys.IN_MINUTES]: 'In minutes',
    [keys.MAX_USER_DURATION]: 'Maximum session duration',
    [keys.DISCONNECT_TIME]: 'Disconnect timeout',
    [keys.IDLE_DISCONNECT_TIMEOUT]: 'Idle disconnect timeout',
    [keys.USER_SESSION_DETAILS]: 'User Session Details',
    [keys.FLEET_SCALING_DETAILS]: 'Fleet Scaling Details',
    [keys.STREAM_VIEW]: 'Stream View',
    [keys.APP]: 'Application',
    [keys.DESKTOP]: 'Desktop',
    [keys.DESIRED_CAPACITY]: 'Desired Capacity',
    [keys.FLEET_CREATION_SUCCESS]: 'You Fleet has been created successfully.',
    [keys.RUNNING]: 'Running',
    [keys.STARTING]: 'Starting',
    [keys.STOPPING]: 'Stopping',
    [keys.STOPPED]: 'Stopped',
    [keys.START_FLEET]: 'Start Fleet',
    [keys.STOP_FLEET]: 'Stop Fleet',
    [keys.DELETE_FLEET]: 'Delete Fleet',
    [keys.START_FLEET_CONFIRMATION]: "Are you sure you want to start the fleet '%{fleet}'?",
    [keys.STOP_FLEET_CONFIRMATION]: "Are you sure you want to stop the fleet '%{fleet}'?",
    [keys.DELETE_FLEET_CONFIRMATION]: "Are you sure you want to delete the fleet '%{fleet}'?",
    [keys.TEST_FLEET]: 'Test Fleet',
    [keys.TEST_FLEET_UNAVAILABLE]:
      'This fleet is attached to an Image with Dynamic Catalogs enabled.  To test please create a Dynamic Catalog.',
    [keys.COPY_LINK]: 'Copy Link',
    [keys.FLEET_DETAILS]: 'Fleet Details',
    [keys.APPSTREAM_FLEETS]: 'AppStream Fleets',
    [keys.APPSTREAM_FLEET]: 'AppStream Fleet',
    [keys.STATUS]: 'Status',
    [keys.DESIRED]: 'Desired',
    [keys.IN_USE]: 'In Use',
    [keys.CAPACITY]: 'Capacity',
    [keys.IMAGE_DETAILS]: 'Image Details',
    [keys.TEST_CATALOG]: 'Test Catalog',
    [keys.SELECT_FLEET]: 'Select Fleet',
    [keys.LINK_COPIED]: 'Link Copied',
    [keys.DELETE_CATALOG]: 'Delete Catalog',
    [keys.DELETE_CATALOG_CONFIRMATION]: "Are you sure you want to delete the Dynamic Catalog '%{dynamicCatalog}'?",
    [keys.DAP_ENABLED]: 'Dynamic Catalogs Enabled?',
    [keys.FAST_ITERATION]: 'Fast Iteration',
    [keys.IMAGE_BUILDER_ID]: 'Image Builder ID',
    [keys.UNKNOWN]: 'Unknown',
    [keys.ACCESS]: 'Access',
    [keys.GRANT_ACCESS]: 'Grant Access',
    [keys.ACCESS_GRANTED]: 'Access Granted.',
    [keys.ACCESS_WAS_GRANTED]: 'Access has been granted.',
    [keys.REVOKE_GROUP_ACCESS_CONFIRMATION]: "Are you sure you want to revoke access to group '%{group}'?",
    [keys.REVOKE_GROUP_SUCCESS]: "Accesss for group '%{groupId}' revoked.",
    [keys.MENU_DASHBOARD]: 'ダッシュボード',
    [keys.SWAP_IMAGE]: 'Swap Image',
    [keys.SWAPPED]: 'Swapped',
    [keys.SWAP_SUCCESS]: 'The image was successfully swapped',
    [keys.CLONE_IMAGE]: 'Clone Image',
    [keys.IMAGE_BUILDER_ID_DESCRIPTION]:
      'You can optionally provide the ID of an existing Image Builder.  If left blank, an Image Builder will automatically be created.',
    [keys.ADVANCED_SETTINGS]: 'Advanced Settings',
    [keys.SNAPSHOT_IMAGE]: 'Snapshot Image Builder',
    [keys.DELETE_IMAGE_BUILDER]: 'Delete Image Builder',
    [keys.BASE_IMAGE]: 'Base Image',
    [keys.BASE_IMAGE_DESCRIPTION]: 'Optionally select a Base Image with pre-installed applications.',
    [keys.METRICS_DASHBOARD]: 'Metrics Dashboard',
    [keys.DAILY_SESSIONS]: 'Daily Sessions',
    [keys.PREVIOUS_MONTH]: 'Previous Month',
    [keys.CURRENT_MONTH]: 'Current Month',
    [keys.AVERAGE_SESSION_LENGTH_BY_FLEET]: 'Average Session Length by Fleet (Minutes)',
  },
};

export default ja;