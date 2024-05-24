import retry from 'async-retry';
import {
  SwapFormFromInputSelectors,
  SwapFormSelectors,
  SwapFormToInputSelectors
} from 'src/app/templates/SwapForm/SwapForm.selectors';
import { AssetsMenuSelectors } from 'src/app/templates/SwapForm/SwapFormInput/AssetsMenu/selectors';

import { Page } from 'src/classes/page.class';
import { createPageElement, findElement } from 'src/utils/search.utils';
import { sleep } from 'src/utils/timing.utils';

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

}
