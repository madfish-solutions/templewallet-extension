import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { Pages } from 'e2e/src/page-objects';
import { envVars } from 'e2e/src/utils/env.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

Given(/I check if added contact is added and displayed/, { timeout: MEDIUM_TIMEOUT }, async () => {
  // Checking if added contact is displaying 'Current contacts' list
  await Pages.AddressBook.isContactAdded(envVars.CONTACT_ADDRESS_PUBLIC_KEY_HASH);

  // Checking if added contact is displayed in the 'Recipient' drop-down on the Send Page
  await Pages.Header.templeLogoButton.click();
  await Pages.Home.isVisible();
  await Pages.Home.SendButton.click();
  await Pages.Send.isVisible();
  await Pages.Send.recipientInput.click();
  await Pages.Send.contactItemButton.waitForDisplayed();

  const contactHashValue = await Pages.Send.contactHashValue.getText();
  expect(contactHashValue).eql(envVars.CONTACT_ADDRESS_PUBLIC_KEY_HASH_SHORT_FORM);
});
