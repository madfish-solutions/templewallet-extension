import { SendFormSelectors } from '../../../../src/app/templates/SendForm/selectors';
import { Page } from '../../classes/page.class';
import { createPageElement, findElements, getElementText } from '../../utils/search.utils';

export class SendPage extends Page {
  assetDropDown = createPageElement(SendFormSelectors.assetDropDown);
  assetName = createPageElement(SendFormSelectors.assetName);
  assetDropDownSearchInput = createPageElement(SendFormSelectors.assetDropDownSearchInput);
  amountInput = createPageElement(SendFormSelectors.amountInput);
  recipientInput = createPageElement(SendFormSelectors.recipientInput);
  sendButton = createPageElement(SendFormSelectors.sendButton);

  async isVisible() {
    await this.assetDropDown.waitForDisplayed();
    await this.recipientInput.waitForDisplayed();
    await this.amountInput.waitForDisplayed();
  }

  async selectToken(tokenName: string) {
    const tokenItems = await findElements(SendFormSelectors.assetName);

    for (const tokenItem of tokenItems) {
      const getTokenName = await getElementText(tokenItem);

      if (getTokenName === tokenName) {
        await tokenItem.click();
        break;
      }
    }
  }
}
