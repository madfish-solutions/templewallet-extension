import { AddressBookSelectors } from 'src/app/templates/AddressBook/AddressBook.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

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

}
