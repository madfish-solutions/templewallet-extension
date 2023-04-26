import { Given } from '@cucumber/cucumber';

import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Pages } from '../page-objects';
import { iEnterValues } from '../utils/input-data.utils';

Given(/I check who the delegated baker is/, { timeout: MEDIUM_TIMEOUT }, async () => {
  const delegatedBaker = await Pages.DelegateTab.delegatedBakerName.getText();
  const everstakeAddress = 'tz1aRoaRhSpRYvFdyvgWLL6TGyRoGF51wDjM';
  const ipocampAddress = 'tz1fbumHTEhLMBmtT1GjagbMnhnTD5YZAJh2';

  if (delegatedBaker === 'Everstake') {
    iEnterValues.bakerAddress = ipocampAddress;
  } else {
    iEnterValues.bakerAddress = everstakeAddress;
  }
});
