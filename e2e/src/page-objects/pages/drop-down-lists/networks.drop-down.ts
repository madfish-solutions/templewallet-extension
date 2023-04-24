import { NetworkSelectSelectors } from 'src/app/layouts/PageLayout/Header/NetworkSelect/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';

export class NetworksDropDown extends Page {
  networkItemButton = createPageElement(NetworkSelectSelectors.networkItemButton);

  async isVisible() {
    await this.networkItemButton.waitForDisplayed();
  }

  async selectNetwork(name: string) {
    const networkItemElem = await findElement(NetworkSelectSelectors.networkItemButton, { name });

    await networkItemElem.click();
  }
}
