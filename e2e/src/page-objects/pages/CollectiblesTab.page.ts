import { CollectibleTabSelectors } from 'src/app/pages/Collectibles/CollectiblesTab/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { SHORT_TIMEOUT, VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

export class CollectiblesTabPage extends Page {
  collectibleItemButton = createPageElement(CollectibleTabSelectors.collectibleItemButton);

  async isVisible() {
    await this.collectibleItemButton.waitForDisplayed();
  }

  async isCollectibleDisplayed(symbol: string) {
    await findElement(
      CollectibleTabSelectors.collectibleTitleInfo,
      { symbol },
      VERY_SHORT_TIMEOUT,
      `${symbol} collectible not found in the collectible list on the CollectiblesTab page`
    );
  }

  async interactVisibleCollectible(symbol: string) {
    const visibleTitleInfo = await findElement(
      CollectibleTabSelectors.collectibleTitleInfo,
      { symbol },
      SHORT_TIMEOUT,
      `Visible title info related to collectible with title: ${symbol} is not displayed in the list`
    );
    await visibleTitleInfo.click();
  }
}
