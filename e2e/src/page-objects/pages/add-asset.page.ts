import { AddAssetSelectors } from 'src/app/pages/AddAsset/AddAsset.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class AddAssetPage extends Page {
  addressInput = createPageElement(AddAssetSelectors.addressInput);
  assetIDInput = createPageElement(AddAssetSelectors.assetIDInput);
  addAssetButton = createPageElement(AddAssetSelectors.addAssetButton);
  symbolInput = createPageElement(AddAssetSelectors.symbolInput);
  nameInput = createPageElement(AddAssetSelectors.nameInput);
  decimalsInput = createPageElement(AddAssetSelectors.decimalsInput);
  iconURLInput = createPageElement(AddAssetSelectors.iconURLInput);

  async isVisible() {
    await this.addressInput.waitForDisplayed();
    await this.assetIDInput.waitForDisplayed();
  }

  async waitAddingAssetPreloaded(assetName: string) {
    await this.addAssetButton.waitForDisplayed();
    await this.symbolInput.waitForDisplayed();
    await this.nameInput.waitForText(assetName);
    await this.decimalsInput.waitForDisplayed();
    await this.iconURLInput.waitForDisplayed();
  }
}
