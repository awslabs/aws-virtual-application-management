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

import { types } from 'mobx-state-tree';
import { BaseStore } from './BaseStore';

// Must be less than or equal to 100
const DEFAULT_RESULTS_PER_PAGE = 10;

const PaginatedBaseStore = BaseStore.named('PaginatedBaseStore')
  .props({
    resultsPerPage: DEFAULT_RESULTS_PER_PAGE,
    nextPageButtonStatus: '',
    nextToken: types.maybeNull(types.optional(types.string, '')),
  })
  .actions(self => {
    return {
      async loadNextPage() {
        if (self.nextPageButtonStatus === 'loading') return;
        const nextToken = self.nextToken;
        if (!nextToken) throw new Error('nextToken must be set to load next page');

        self.runInAction(() => {
          self.nextPageButtonStatus = 'loading';
        });

        try {
          // doLoadNextPage must actually implement the loading and updating of store data.
          // It should return the `nextToken` as a property on the response.
          const response = await self.doLoadNextPage(nextToken);

          self.runInAction(() => {
            self.nextToken = response.nextToken;
          });
        } catch (err) {
          self.runInAction(() => {
            self.nextPageButtonStatus = '';
            throw err;
          });
        }

        self.runInAction(() => {
          self.nextPageButtonStatus = '';
        });
      },

      updateResultsPerPage(resultsPerPage) {
        if (resultsPerPage !== self.resultsPerPage) {
          self.runInAction(() => {
            self.resultsPerPage = resultsPerPage;
          });
        }
      },
    };
  })
  .views(self => ({
    get isLoadingNextPage() {
      return self.nextPageButtonStatus === 'loading';
    },
  }));

export { PaginatedBaseStore }; // eslint-disable-line import/prefer-default-export
