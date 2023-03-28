import { Given } from '@cucumber/cucumber';
import { ElementHandle } from 'puppeteer';

import { testDataForInput } from '../classes/test-data-for-input.class';
import { Pages } from '../page-objects';
import { TWENTY_SECONDS_TIMEOUT } from '../utils/timing.utils';

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

Given(/I press on A,B or unknown Delegate Button/, { timeout: TWENTY_SECONDS_TIMEOUT }, async () => {
  const TIMEOUT = 1000;

  try {
    const unknownBakerButton = await Promise.race([
      Pages.DelegateForm.unknownBakerDelegateButton.waitForDisplayed(),
      new Promise(resolve => setTimeout(resolve, TIMEOUT))
    ]);
    await (unknownBakerButton as ElementHandle).click();
  } catch (error1) {
    try {
      const knownBakerItemAButton = await Promise.race([
        Pages.DelegateForm.knownBakerItemDelegateAButton.waitForDisplayed(),
        new Promise(resolve => setTimeout(resolve, TIMEOUT))
      ]);
      await (knownBakerItemAButton as ElementHandle).click();
    } catch (error2) {
      const knownBakerItemBButton = await Promise.race([
        Pages.DelegateForm.knownBakerItemDelegateBButton.waitForDisplayed(),
        new Promise(resolve => setTimeout(resolve, TIMEOUT))
      ]);
      await (knownBakerItemBButton as ElementHandle).click();
    }
  }
});
