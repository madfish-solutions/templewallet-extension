import { SendFormSelectors } from 'src/app/templates/SendForm/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement, findElement } from '../../utils/search.utils';

export class SendPage extends Page {
  assetDropDown = createPageElement(SendFormSelectors.assetDropDown);
  assetDropDownSearchInput = createPageElement(SendFormSelectors.assetDropDownSearchInput);
  amountInput = createPageElement(SendFormSelectors.amountInput);
  recipientInput = createPageElement(SendFormSelectors.recipientInput);
  sendButton = createPageElement(SendFormSelectors.sendButton);
  contactItemButton = createPageElement(SendFormSelectors.contactItemButton);
  contactHashValue = createPageElement(SendFormSelectors.contactHashValue);

  async isVisible() {
    await this.assetDropDown.waitForDisplayed();
    await this.recipientInput.waitForDisplayed();
    await this.amountInput.waitForDisplayed();
  }

  async selectToken(slug: string) {
    const tokenItemElem = await findElement(SendFormSelectors.assetDropDownItem, { slug });

    await tokenItemElem.click();

    await createPageElement(SendFormSelectors.assetDropDownSelect, { slug }).waitForDisplayed();
  }
}
