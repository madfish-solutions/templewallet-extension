import retry from 'async-retry';
import {
  SwapFormFromInputSelectors,
  SwapFormSelectors,
  SwapFormToInputSelectors
} from 'src/app/templates/SwapForm/SwapForm.selectors';
import { AssetsMenuSelectors } from 'src/app/templates/SwapForm/SwapFormInput/AssetsMenu/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { sleep } from 'e2e/src/utils/timing.utils';

export class SwapPage extends Page {
  swapPlacesButton = createPageElement(SwapFormSelectors.swapPlacesButton);
  swapButton = createPageElement(SwapFormSelectors.swapButton);

  assetInputFrom = createPageElement(SwapFormFromInputSelectors.assetInput);
  assetItemFrom = createPageElement(SwapFormFromInputSelectors.assetDropDownButton);
  searchInputFrom = createPageElement(SwapFormFromInputSelectors.searchInput);

  assetInputTo = createPageElement(SwapFormToInputSelectors.assetInput);
  assetItemTo = createPageElement(SwapFormToInputSelectors.assetDropDownButton);
  searchInputTo = createPageElement(SwapFormToInputSelectors.searchInput);

  async isVisible() {
    await this.swapPlacesButton.waitForDisplayed();
    await this.swapButton.waitForDisplayed();
    await this.assetInputFrom.waitForDisplayed();
    await this.assetItemFrom.waitForDisplayed();
    await this.assetInputTo.waitForDisplayed();
    await this.assetItemTo.waitForDisplayed();
  }

  async selectAsset(slug: string) {
    // Retrying here, because sometimes element reference is lost between
    // finding it and clicking. Common for drop-down menus.
    await retry(
      async () => {
        const tokenItemElem = await findElement(AssetsMenuSelectors.assetsMenuAssetItem, { slug });
        await sleep(1_000); // TODO: Try to get rid of it
        await tokenItemElem.click();
      },
      { retries: 10 }
    );
  }
}
