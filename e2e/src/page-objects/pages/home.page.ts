import { ExploreSelectors } from '../../../../src/app/pages/Explore.selectors';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class HomePage extends Page {
  ReceiveButton = createPageElement(ExploreSelectors.ReceiveButton);
  BuyButton = createPageElement(ExploreSelectors.BuyButton);
  SendButton = createPageElement(ExploreSelectors.SendButton);
  WithdrawButton = createPageElement(ExploreSelectors.WithdrawButton);
  SwapButton = createPageElement(ExploreSelectors.SwapButton);
  AssetsTab = createPageElement(ExploreSelectors.AssetsTab);
  ActivityTab = createPageElement(ExploreSelectors.ActivityTab);
  CollectiblesTab = createPageElement(ExploreSelectors.CollectiblesTab);
  PublicAddressButton = createPageElement(ExploreSelectors.PublicAddressButton);

  async isVisible() {
    await this.ReceiveButton.waitForDisplayed();
    await this.BuyButton.waitForDisplayed();
    await this.SendButton.waitForDisplayed();
    await this.WithdrawButton.waitForDisplayed();
    await this.SwapButton.waitForDisplayed();
    await this.AssetsTab.waitForDisplayed();
    await this.ActivityTab.waitForDisplayed();
    await this.CollectiblesTab.waitForDisplayed();
    await this.PublicAddressButton.waitForDisplayed();
  }
}
