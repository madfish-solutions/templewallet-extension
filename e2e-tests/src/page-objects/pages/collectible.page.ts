import { CollectiblesSelectors } from 'src/app/pages/Collectibles/CollectiblePage/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class CollectiblePage extends Page {
  sellButton = createPageElement(CollectiblesSelectors.sellButton);
  sendButton = createPageElement(CollectiblesSelectors.sendButton);
  CollectibleTitle = createPageElement(CollectiblesSelectors.collectibleTitle);

  async isVisible() {
    await this.sellButton.waitForDisplayed();
    await this.sendButton.waitForDisplayed();
    await this.CollectibleTitle.waitForDisplayed();
  }
}
