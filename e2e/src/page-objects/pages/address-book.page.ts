import { AddressBookSelectors } from 'src/app/templates/AddressBook/AddressBook.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { sleep, VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

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

  async isContactAdded(hash: string) {
    await findElement(
      AddressBookSelectors.contactItem,
      { hash },
      VERY_SHORT_TIMEOUT,
      `The contact with address: '${hash}' not found`
    );
    const deleteContactButton = await findElement(
      AddressBookSelectors.deleteContactButton,
      { hash },
      VERY_SHORT_TIMEOUT,
      `The delete contact button related to address: '${hash}' not found`
    );
    return deleteContactButton;
  }

  async deleteContact(hash: string) {
    const addedContact = await this.isContactAdded(hash);
    await addedContact.click();
  }

  async isContactDeleted(hash: string) {
    await sleep(2000);
    const notDeletedError = `The contact '${hash}' not deleted`;

    try {
      await this.isContactAdded(hash).then(() => {
        throw notDeletedError;
      });
    } catch (error) {
      const errorName = JSON.stringify(error);
      if (errorName.includes(notDeletedError)) throw errorName;
    }
  }
}
