import { Given } from '@cucumber/cucumber';

import { testDataForInput } from '../classes/test-data-for-input.class';
import { Pages } from '../page-objects';
import { VERY_LONG_TIMEOUT } from '../utils/timing.utils';

Given(/I check who the delegated baker is/, async () => {
  const delegatedBaker = await Pages.DelegateTab.delegatedBakerName.getText();

  if (delegatedBaker === 'Everstake') {
    // To avoid "Not allowed" error it will be used another baker address (Ipocamp)
    testDataForInput.bakerAddress = 'tz1fbumHTEhLMBmtT1GjagbMnhnTD5YZAJh2';
  } else {
    // Everstake baker address
    testDataForInput.bakerAddress = 'tz1aRoaRhSpRYvFdyvgWLL6TGyRoGF51wDjM';
  }
});

Given(/I press on A,B or unknown Delegate Button/, { timeout: VERY_LONG_TIMEOUT }, async () => {
  try {
    const unknownBakerButton = await Pages.DelegateForm.unknownBakerDelegateButton.waitForDisplayed();
    await unknownBakerButton.click();
  } catch (error1) {
    try {
      const knownBakerItemAButton = await Pages.DelegateForm.knownBakerItemDelegateAButton.waitForDisplayed();
      await knownBakerItemAButton.click();
    } catch (error2) {
      const knownBakerItemBButton = await Pages.DelegateForm.knownBakerItemDelegateBButton.waitForDisplayed();
      await knownBakerItemBButton.click();
    }
  }
});
