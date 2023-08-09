import retry from 'async-retry';
import { AddressBookSelectors } from 'src/app/templates/AddressBook/AddressBook.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { RETRY_OPTIONS, VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

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

  async clickDeleteContact(hash: string) {
    const contactDeleteBtn = await this.isContactAdded(hash);
    await contactDeleteBtn.click();
  }

  async isContactDeleted(hash: string) {
    await retry(
      () =>
        this.isContactAdded(hash).then(
          () => {
            throw new Error(`The contact '${hash}' not deleted`);
          },
          () => undefined
        ),
      RETRY_OPTIONS
    );
  }
}
