import retry from 'async-retry';
import { ManageAssetsSelectors } from 'src/app/pages/ManageAssets/selectors';

import { RETRY_OPTIONS, SHORT_TIMEOUT, VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Page } from '../../classes/page.class';
import { createPageElement, findElement } from '../../utils/search.utils';

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

  async isAssetInTokenList(slug: string) {
    await findElement(
      ManageAssetsSelectors.assetItem,
      { slug },
      SHORT_TIMEOUT,
      `Token with slug: ${slug} is not displayed in the list`
    );

    await findElement(
      ManageAssetsSelectors.deleteAssetButton,
      { slug },
      SHORT_TIMEOUT,
      `Delete token button related to token with slug: ${slug} is not displayed in the list`
    );
  }

  // for hiding or revealing assets
  async interactVisibleAsset(slug: string) {
    const visibleCheckBox = await findElement(
      ManageAssetsSelectors.assetItem,
      { slug },
      SHORT_TIMEOUT,
      `Visible asset checkbox related to token with slug: ${slug} is not displayed in the list`
    );
    await visibleCheckBox.click();
  }

  async clickDeleteAsset(slug: string) {
    const contactDeleteBtn = await findElement(
      ManageAssetsSelectors.deleteAssetButton,
      { slug },
      SHORT_TIMEOUT,
      `Delete token button related to token with slug: ${slug} is not displayed in the list`
    );
    await contactDeleteBtn.click();
  }

  async isAssetDeleted(slug: string) {
    await retry(
      async () =>
        await findElement(ManageAssetsSelectors.assetItem, { slug }, VERY_SHORT_TIMEOUT).then(
          () => {
            throw new Error(`Token with slug: '${slug}' not deleted`);
          },
          () => undefined
        ),
      RETRY_OPTIONS
    );
  }
}
