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
  const bakerButtons = [
    Pages.DelegateForm.knownBakerItemDelegateAButton,
    Pages.DelegateForm.knownBakerItemDelegateBButton,
    Pages.DelegateForm.unknownBakerDelegateButton
  ];

  let buttonClicked = false;

  for (const button of [...bakerButtons]) {
    try {
      const element = (await Promise.race([
        button.waitForDisplayed(),
        new Promise(resolve => setTimeout(resolve, TIMEOUT))
      ])) as ElementHandle;
      if (element) {
        await element.click();
        buttonClicked = true;
        break;
      }
    } catch (error) {}
  }

  if (!buttonClicked) {
    throw new Error('No delegate button found');
  }
});
