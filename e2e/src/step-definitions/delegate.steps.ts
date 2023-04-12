import { Given } from '@cucumber/cucumber';

import { Pages } from '../page-objects';
import { iEnterValues } from '../utils/input-data.utils';

Given(/I check who the delegated baker is/, async () => {
  const delegatedBaker = await Pages.DelegateTab.delegatedBakerName.getText();
  const everstakeAddress = 'tz1aRoaRhSpRYvFdyvgWLL6TGyRoGF51wDjM';
  const ipocampAddress = 'tz1fbumHTEhLMBmtT1GjagbMnhnTD5YZAJh2';

  if (delegatedBaker === 'Everstake') {
    iEnterValues.bakerAddress = ipocampAddress;
  } else {
    iEnterValues.bakerAddress = everstakeAddress;
  }
});
