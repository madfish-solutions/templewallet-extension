import { ManageAssetsSelectors } from 'src/app/pages/ManageAssets/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class ManageAssetsTokensPage extends Page {
  addAssetButton = createPageElement(ManageAssetsSelectors.addAssetButton);
  searchAssetsInput = createPageElement(ManageAssetsSelectors.searchAssetsInput);
  assetItem = createPageElement(ManageAssetsSelectors.assetItem);
  deleteAssetButton = createPageElement(ManageAssetsSelectors.deleteAssetButton);

  async isVisible() {
    await this.addAssetButton.waitForDisplayed();
    await this.searchAssetsInput.waitForDisplayed();
    await this.assetItem.waitForDisplayed();
    await this.deleteAssetButton.waitForDisplayed();
  }
}
