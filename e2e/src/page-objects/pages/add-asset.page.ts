import { AddAssetSelectors } from 'src/app/pages/AddAsset/AddAsset.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

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

}
