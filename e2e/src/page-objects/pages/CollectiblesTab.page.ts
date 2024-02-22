import { CollectibleTabSelectors } from 'src/app/pages/Collectibles/CollectiblesTab/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { SHORT_TIMEOUT, VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

export class CollectiblesTabPage extends Page {
  collectibleItemButton = createPageElement(CollectibleTabSelectors.collectibleItemButton);

  async isVisible() {
    await this.collectibleItemButton.waitForDisplayed();
  }

  async isCollectibleDisplayed(name: string) {
    await findElement(
      CollectibleTabSelectors.collectibleTitleInfo,
      { name },
      VERY_SHORT_TIMEOUT,
      `Collectible '${name}' not clicked`
    );
  }

  async clickOnCollectibleItem(name: string) {
    const titleElem = createPageElement(CollectibleTabSelectors.collectibleTitleInfo, { name: name });

    await titleElem.click(SHORT_TIMEOUT, `Collectible '${name}' not clicked`);
  }
}
