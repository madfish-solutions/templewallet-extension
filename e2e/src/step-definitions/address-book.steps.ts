import { Given } from '@cucumber/cucumber';
import { SendFormSelectors } from 'src/app/templates/SendForm/selectors';

import { Pages } from 'e2e/src/page-objects';
import { findElement } from 'e2e/src/utils/search.utils';
import { MEDIUM_TIMEOUT, sleep, VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

Given(
  /I check if added contact = '(.*)' is displaying 'Current contacts' list/,
  { timeout: MEDIUM_TIMEOUT },
  async (contact: string) => {
    await Pages.AddressBook.isContactAdded(contact);
  }
);

Given(
  /I check if added contact = '(.*)' is displayed in the 'Recipient' drop-down on the Send Page/,
  { timeout: MEDIUM_TIMEOUT },
  async (hash: string) => {
    await Pages.Header.templeLogoButton.click();
    await Pages.Home.isVisible();
    await Pages.Home.SendButton.click();
    await Pages.Send.isVisible();
    await Pages.Send.recipientInput.click();
    await Pages.Send.contactItemButton.waitForDisplayed();

    await findElement(
      SendFormSelectors.contactHashValue,
      { hash },
      VERY_SHORT_TIMEOUT,
      `The contact '${hash}' not found in the 'Recipient' drop-down on the Send Page`
    );
  }
);

Given(
  /I find an added contact = '(.*)' and click to delete it/,
  { timeout: MEDIUM_TIMEOUT },
  async (contact: string) => {
    await sleep(1000);
    await Pages.AddressBook.deleteContact(contact);
  }
);

Given(
  /I check if added contact = '(.*)' is deleted from the 'Current contacts' list/,
  { timeout: MEDIUM_TIMEOUT },
  async (contact: string) => {
    await Pages.AddressBook.isContactDeleted(contact);
  }
);
