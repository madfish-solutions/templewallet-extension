import { Given } from '@cucumber/cucumber';

import { testDataForInput } from '../classes/test-data-for-input.class';
import { Pages } from '../page-objects';

Given(/I check who the delegated baker is/, async () => {
  const delegatedBaker = await Pages.DelegateTab.delegatedBakerName.getText();
  const everstakeAddress = 'tz1aRoaRhSpRYvFdyvgWLL6TGyRoGF51wDjM';
  const ipocampAddress = 'tz1fbumHTEhLMBmtT1GjagbMnhnTD5YZAJh2';

  if (delegatedBaker === 'Everstake') {
    testDataForInput.bakerAddress = ipocampAddress;
  } else {
    testDataForInput.bakerAddress = everstakeAddress;
  }
});
