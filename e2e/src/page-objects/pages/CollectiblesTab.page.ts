import { CollectibleTabSelectors } from 'src/app/pages/Collectibles/CollectiblesTab/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class CollectiblesTabPage extends Page {
  collectibleItemButton = createPageElement(CollectibleTabSelectors.collectibleItem);

  async isVisible() {
    await this.collectibleItemButton.waitForDisplayed();
  }
}
