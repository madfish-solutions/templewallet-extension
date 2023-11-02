import retry from 'async-retry';
import { NetworkSelectSelectors } from 'src/app/layouts/PageLayout/Header/NetworkSelect/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { ONE_SECOND, RETRY_OPTIONS } from 'e2e/src/utils/timing.utils';

export class NetworksDropDown extends Page {
  networkItemButton = createPageElement(NetworkSelectSelectors.networkItemButton);

  async isVisible(timeout?: number) {
    await this.networkItemButton.waitForDisplayed(timeout);
  }

  async isClosed() {
    await retry(
      () =>
        this.isVisible(ONE_SECOND).then(
          () => {
            throw new Error(`Networks dropdown is still opened`);
          },
          () => undefined
        ),
      RETRY_OPTIONS
    );
  }

  async selectNetwork(name: string) {
    const networkItemElem = await findElement(NetworkSelectSelectors.networkItemButton, { name });

    await networkItemElem.click();
  }
}
