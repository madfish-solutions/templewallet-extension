import { Given } from '@cucumber/cucumber';
import { SendFormSelectors } from 'src/app/templates/SendForm/selectors';

import { Pages } from 'e2e/src/page-objects';
import { iEnterValues } from 'e2e/src/utils/input-data.utils';
import { findElement } from 'e2e/src/utils/search.utils';
import { MEDIUM_TIMEOUT, VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

type ContactVarName = 'contactPublicKey' | 'secondContactPublicKey';

Given(
  /I check if added contact = '(.*)' is displayed on 'Current contacts' list/,
  { timeout: MEDIUM_TIMEOUT },
  async (contactVarName: ContactVarName) => {
    await Pages.AddressBook.isContactAdded(iEnterValues[contactVarName]);
  }
);

Given(
  /I check if added contact = '(.*)' is displayed in the 'Recipient' drop-down on the Send Page/,
  { timeout: MEDIUM_TIMEOUT },
  async (contactVarName: ContactVarName) => {
    const hash = iEnterValues[contactVarName];

    await Pages.Header.templeLogoButton.click();
    await Pages.Home.isVisible();
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
  async (contactVarName: ContactVarName) => {
    await Pages.AddressBook.clickDeleteContact(iEnterValues[contactVarName]);
  }
);

Given(
  /I check if added contact = '(.*)' is deleted from the 'Current contacts' list/,
  { timeout: MEDIUM_TIMEOUT },
  async (contactVarName: ContactVarName) => {
    await Pages.AddressBook.isContactDeleted(iEnterValues[contactVarName]);
  }
);
