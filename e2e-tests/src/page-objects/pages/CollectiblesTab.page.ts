import { CollectibleTabSelectors } from 'src/app/pages/Collectibles/CollectiblesTab/selectors';

import { Page } from 'src/classes/page.class';
import { createPageElement } from 'src/utils/search.utils';

export class CollectiblesTabPage extends Page {
  collectibleItemButton = createPageElement(CollectibleTabSelectors.collectibleItem);

  async isVisible() {
    await this.collectibleItemButton.waitForDisplayed();
  }
}
