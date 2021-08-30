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

import {
  InputManifest,
  isInteractive,
  toMobxFormFieldProps,
  isConditionTrue,
  toMobxFormFields,
  applyMarkdown,
  visit,
} from '../InputManifest';

describe('EditAuthenticationProviderForm', () => {
  const value = 'value';
  const desc = 'desc';
  const options = 'options';
  const yesLabel = 'yesLabel';
  const noLabel = 'noLabel';
  const name = 'name';
  const base = {
    value,
    name,
    placeholder: 'placeholder',
    rules: 'rules',
    default: value,
    disabled: true,
  };
  const rawEntry = {
    ...base,
    desc,
    options,
    yesLabel,
    noLabel,
    nonInteractive: false,
    disabled: true,
  };
  const rawEntryWithChildren = {
    ...rawEntry,
    children: [rawEntry],
  };
  const mobxFormFieldEntryWithoutExtra = {
    ...base,
    default: 'value',
  };
  const mobxFormFieldEntry = {
    ...mobxFormFieldEntryWithoutExtra,
    extra: {
      explain: desc,
      options,
      yesLabel,
      noLabel,
    },
  };

  describe('isInteractive', () => {
    it.each`
      entry                        | expected
      ${undefined}                 | ${false}
      ${{ nonInteractive: true }}  | ${false}
      ${{}}                        | ${true}
      ${{ nonInteractive: false }} | ${true}
    `('correctly classifies entry', ({ entry, expected }) => {
      expect(isInteractive(entry)).toBe(expected);
    });
  });

  describe('isConditionTrue', () => {
    it.each`
      condition    | config              | expected
      ${undefined} | ${'<%=condition%>'} | ${true}
      ${'test'}    | ${'<%=condition%>'} | ${false}
      ${'true'}    | ${'<%=condition%>'} | ${true}
    `('correctly classifies entry', ({ condition, config, expected }) => {
      expect(isConditionTrue(condition, config)).toBe(expected);
    });
  });

  describe('toMobxFormFieldProps', () => {
    it('should return an object containing all supported mobx fields', () =>
      expect(toMobxFormFieldProps(rawEntry, value)).toMatchObject(mobxFormFieldEntry));
  });

  describe('toMobxFormFields', () => {
    it('should return objects containing all supported mobx fields', () =>
      expect(toMobxFormFields([rawEntryWithChildren], '<%=condition%>')).toMatchObject([
        mobxFormFieldEntry,
        mobxFormFieldEntry,
      ]));
  });

  describe('visit', () => {
    it('should return objects containing without extra fields', () =>
      expect(visit([rawEntryWithChildren])).toMatchObject([
        mobxFormFieldEntryWithoutExtra,
        mobxFormFieldEntryWithoutExtra,
      ]));
  });

  describe('applyMarkdown', () => {
    const sections = [{ desc }];
    const inputManifest = InputManifest.create({ sections });
    it('should return an object containing the sections from the input manifest', () =>
      expect(applyMarkdown({ inputManifest })).toMatchObject({ sections }));
  });

  describe('names', () => {
    const sections = [{ desc, children: [rawEntryWithChildren] }];
    const inputManifest = InputManifest.create({ sections });
    it('should return all input manifest names', () => expect(inputManifest.names).toEqual([name, name]));
  });

  describe('getSectionFlattened', () => {
    const section = { desc, children: [rawEntryWithChildren] };
    const sections = [section];
    const inputManifest = InputManifest.create({ sections });
    it('should return all sections flattened', () =>
      expect(inputManifest.getSectionFlattened({ children: sections })).toEqual([
        section,
        rawEntryWithChildren,
        rawEntry,
      ]));
    expect(inputManifest.empty).toBe(false);
  });
});
