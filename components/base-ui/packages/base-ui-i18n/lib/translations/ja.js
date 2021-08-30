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
    // Splash
    [keys.LOADING_TITLE]: '少々待ちください',
    [keys.LOADING_SUBTITLE]: 'ローディング中',
    [keys.DEFAULT_ERROR_MESSAGE]: 'ブラウザを更新してください',
    [keys.APP_ERROR_MESSAGE]:
      'Something went wrong and the error message is %{errorDetail}.  Please refresh your browser.',
    // Login UI
    [keys.LOGIN]: 'ログイン',
    [keys.LOGOUT]: 'ログアウト',
    [keys.USERNAME]: 'ユーザー名',
    [keys.PASSWORD]: 'パースワード',
    [keys.USERNAME_REQUIRED]: 'ユーザー名が必要です',
    [keys.USERNAME_MIN_LENGTH]: 'ユーザー名は3文字以上にする必要があります',
    [keys.PASSWORD_REQUIRED]: 'パースワードが必要です',
    [keys.PASSWORD_MIN_LENGTH]: 'ユーザー名は4文字以上にする必要があります',
    // Errors and Notifications
    [keys.WE_HAVE_A_PROBLEM]: '問題があります！',
    [keys.WARNING]: '警告',
    [keys.SUBMITTED]: '送信されました',
    [keys.FORM_SUBMISSION_PROBLEM]: 'フォームの送信に問題があります',
    [keys.ISSUES_WITH_FORM]: 'フォームに問題があります：',
    [keys.UNKNOWN_ERROR]: '不明なエラー',
    // Main layout menu items
    [keys.MENU_DASHBOARD]: 'ダッシュボード',
    [keys.MENU_AUTH]: '認証',
    [keys.MENU_USERS]: 'ユーザー',
    [keys.MENU_API_KEYS]: 'APIキー',
    [keys.MENU_VERSION]: '版',
    // General
    [keys.CONFIRM]: '確認',
    [keys.CANCEL]: 'キャンセル',
    [keys.DONE]: '終了',
  },
};

export default ja;
