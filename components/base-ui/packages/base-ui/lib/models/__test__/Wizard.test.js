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

import _ from 'lodash/fp';
import { itProp, fc } from 'jest-fast-check';
import { createWizard } from '../Wizard';

describe('Wizard', () => {
  const key1 = 'key1';
  const title1 = 'title1';
  const key2 = 'key2';
  const title2 = 'title2';
  const wizard = createWizard([
    {
      key: key1,
      title: title1,
    },
    {
      key: key2,
      title: title2,
    },
  ]);

  const expectWizard = isAtStart => {
    expect(wizard.currentStep.key).toEqual(isAtStart ? key1 : key2);
    expect(wizard.isStepActive(key1)).toBe(isAtStart);
    expect(wizard.hasNext).toBe(isAtStart);
    expect(wizard.isStepActive(key2)).toBe(!isAtStart);
    expect(wizard.hasPrevious).toBe(!isAtStart);
  };

  it('initializes to be at first step', () => expectWizard(true));

  it('can move using next, previous and goTo', () => {
    wizard.next();
    expectWizard(false);
    wizard.previous();
    expectWizard(true);
    wizard.goTo(key2);
    expectWizard(false);
  });

  itProp('sets step using isComplete', fc.boolean(), isComplete => {
    const step = _.head(wizard.steps);
    step.setComplete(isComplete);
    expect(step.isComplete).toBe(isComplete);
  });
});
