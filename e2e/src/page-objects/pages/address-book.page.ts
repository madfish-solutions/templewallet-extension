import { AddressBookSelectors } from 'src/app/templates/AddressBook/AddressBook.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

export class AddressBookPage extends Page {
  addressInput = createPageElement(AddressBookSelectors.addressInput);
  nameInput = createPageElement(AddressBookSelectors.nameInput);
  addContactButton = createPageElement(AddressBookSelectors.addContactButton);
  contactItem = createPageElement(AddressBookSelectors.contactItem);
  deleteContactButton = createPageElement(AddressBookSelectors.deleteContactButton);
  contactOwnLabelText = createPageElement(AddressBookSelectors.contactOwnLabelText);

  async isVisible() {
    await this.addressInput.waitForDisplayed();
    await this.nameInput.waitForDisplayed();
    await this.addContactButton.waitForDisplayed();
    await this.contactItem.waitForDisplayed();
    await this.contactOwnLabelText.waitForDisplayed();
  }

  isContactAdded(hash: string) {
    return findElement(AddressBookSelectors.contactItem, { hash }, VERY_SHORT_TIMEOUT);
  }
}
