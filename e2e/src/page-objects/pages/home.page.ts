import { HomeSelectors } from '../../../../src/app/pages/Home/Home.selectors';
import { AssetsSelectors } from '../../../../src/app/pages/Home/OtherComponents/Assets.selectors';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class HomePage extends Page {
  ReceiveButton = createPageElement(HomeSelectors.receiveButton);
  BuyButton = createPageElement(HomeSelectors.buyButton);
  SendButton = createPageElement(HomeSelectors.sendButton);
  WithdrawButton = createPageElement(HomeSelectors.withdrawButton);
  SwapButton = createPageElement(HomeSelectors.swapButton);
  AssetsTab = createPageElement(HomeSelectors.assetsTab);
  ActivityTab = createPageElement(HomeSelectors.activityTab);
  CollectiblesTab = createPageElement(HomeSelectors.collectiblesTab);
  PublicAddressButton = createPageElement(HomeSelectors.publicAddressButton);
  AssetDelegateButton = createPageElement(AssetsSelectors.assetItemDelegateButton);

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
