import { HomeSelectors } from 'src/app/pages/Home/Home.selectors';
import { TokenPageSelectors } from 'src/app/pages/Home/OtherComponents/TokenPage.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

export class TokenPage extends Page {
  pageName = createPageElement(TokenPageSelectors.pageName);
  tokenName = createPageElement(TokenPageSelectors.pageName);
  publicAddressButton = createPageElement(TokenPageSelectors.pageName);
  ReceiveButton = createPageElement(HomeSelectors.receiveButton);
  BuyButton = createPageElement(HomeSelectors.buyButton);
  SendButton = createPageElement(HomeSelectors.sendButton);
  SwapButton = createPageElement(HomeSelectors.swapButton);
  ActivityTab = createPageElement(HomeSelectors.activityTab);
  accountNameText = createPageElement(HomeSelectors.accountNameText);

  async isVisible() {
    await this.pageName.waitForDisplayed();
    await this.tokenName.waitForDisplayed();
    await this.publicAddressButton.waitForDisplayed();
    await this.ReceiveButton.waitForDisplayed();
    await this.BuyButton.waitForDisplayed();
    await this.SendButton.waitForDisplayed();
    await this.SwapButton.waitForDisplayed();
    await this.ActivityTab.waitForDisplayed();
    await this.accountNameText.waitForDisplayed();
  }

  async isCorrectPageSelected(symbol: string, name: string) {
    await findElement(
      TokenPageSelectors.pageName,
      { symbol },
      SHORT_TIMEOUT,
      `${symbol} page is not selected, probably other page is selected/displayed or metadata is not loaded`
    );
    await findElement(
      TokenPageSelectors.tokenName,
      { name },
      SHORT_TIMEOUT,
      `${name} token is not displayed, probably other page is selected/displayed or metadata is not loaded`
    );
  }
}
