import { ManageAssetsSelectors } from 'src/app/pages/ManageAssets/ManageAssets.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class ManageAssetsCollectiblesPage extends Page {
  addCollectiblesButton = createPageElement(ManageAssetsSelectors.addCollectiblesButton);
  searchAssetsInput = createPageElement(ManageAssetsSelectors.searchAssetsInput);
  assetItem = createPageElement(ManageAssetsSelectors.assetItem);
  deleteAssetButton = createPageElement(ManageAssetsSelectors.deleteAssetButton);

  async isVisible() {
    await this.addCollectiblesButton.waitForDisplayed();
    await this.searchAssetsInput.waitForDisplayed();
    await this.assetItem.waitForDisplayed();
    await this.deleteAssetButton.waitForDisplayed();
  }
}
