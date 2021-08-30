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
import { BaseStore } from '@aws-ee/base-ui/dist/models/BaseStore';

import { getAppstreamImages, createAppstreamImage, deleteImage } from '../../helpers/api';
import AppstreamImage from './AppstreamImage';

const AppstreamImagesStore = BaseStore.named('AppstreamImagesStore')
  .props({
    appstreamImages: types.optional(types.map(AppstreamImage), {}),
    tickPeriod: 60 * 1000, // 60 seconds
  })
  .actions(self => {
    return {
      async doLoad() {
        const appstreamImages = await getAppstreamImages();
        self.runInAction(() => {
          const map = {};
          appstreamImages.forEach(data => {
            const appstreamImageModel = AppstreamImage.create(data);
            map[appstreamImageModel.id] = appstreamImageModel;
          });
          self.appstreamImages.replace(map);
        });
      },
      async createAppstreamImage({
        imageName,
        applications,
        dapEnabled,
        baseImageArn,
        imageBuilderID,
        snapshotImage,
        deleteImageBuilder,
        instanceType,
      }) {
        const data = await createAppstreamImage({
          imageName,
          applications,
          dapEnabled,
          baseImageArn,
          imageBuilderID,
          snapshotImage,
          deleteImageBuilder,
          instanceType,
        });
        self.runInAction(() => {
          const appstreamImage = AppstreamImage.create(data);
          self.appstreamImages.set(appstreamImage.id, appstreamImage);
        });
      },
      async deleteImage(name) {
        await deleteImage({ imageName: name });
        self.runInAction(() => {
          self.appstreamImages.delete(name);
        });
      },
    };
  })
  .views(self => ({
    get empty() {
      return self.appstreamImages.size === 0;
    },
    get list() {
      const result = [];
      // converting map self.apiKeys to result array
      self.appstreamImages.forEach(appstreamImage => result.push(appstreamImage));
      return result;
    },

    getById(id) {
      return self.appstreamImages.get(id);
    },

    get availableImages() {
      const result = [];
      self.appstreamImages.forEach(image => {
        if (image.isAvailable) {
          result.push(image);
        }
      });
      return result;
    },

    get dropdownOptions() {
      return self.availableImages.map(image => {
        return {
          key: image.id,
          value: image.id,
          text: image.id,
        };
      });
    },
    get dropdownOptionsWithArn() {
      return self.availableImages.map(image => {
        return {
          key: image.id,
          value: image.arn,
          text: image.id,
        };
      });
    },
  }));

function registerContextItems(appContext) {
  appContext.appstreamImagesStore = AppstreamImagesStore.create({}, appContext);
}

export { AppstreamImagesStore, registerContextItems };
