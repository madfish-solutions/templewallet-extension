import { CollectiblesSelectors } from 'src/app/pages/Collectibles/CollectiblePage/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

export class CollectiblePage extends Page {
  sellButton = createPageElement(CollectiblesSelectors.sellButton);
  sendButton = createPageElement(CollectiblesSelectors.sendButton);
  CollectibleTitle = createPageElement(CollectiblesSelectors.CollectibleTitle);

  async isVisible() {
    await this.sellButton.waitForDisplayed();
    await this.sendButton.waitForDisplayed();
    await this.CollectibleTitle.waitForDisplayed();
  }

  async isCorrectCollectibleSelected() {
    await findElement(
      CollectiblesSelectors.CollectibleTitle,
      {},
      SHORT_TIMEOUT,
      ` The perfect NFT collectible is not selected, probably other collectible is selected/displayed or metadata is not loaded`
    );
    await findElement(
      CollectiblesSelectors.CollectibleTitle,
      {},
      SHORT_TIMEOUT,
      ` collectible is not displayed, probably other collectible is selected/displayed or metadata is not loaded`
    );
  }
}
