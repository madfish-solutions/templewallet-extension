import retry from 'async-retry';
import { NetworkSelectSelectors } from 'src/app/layouts/PageLayout/Header/NetworkSelect/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElement } from 'e2e/src/utils/search.utils';
import { ONE_SECOND, RETRY_OPTIONS } from 'e2e/src/utils/timing.utils';

const STILL_OPENED_ERROR_MESSAGE = 'Networks dropdown is still opened';

export class NetworksDropDown extends Page {
  networkItemButton = createPageElement(NetworkSelectSelectors.networkItemButton);

  async isVisible(timeout?: number) {
    await this.networkItemButton.waitForDisplayed(timeout);
  }

  async isClosed() {
    retry(async bail => {
      try {
        await this.isVisible(ONE_SECOND);
        throw new Error(STILL_OPENED_ERROR_MESSAGE);
      } catch (e: any) {
        if (e.message === STILL_OPENED_ERROR_MESSAGE) {
          throw e;
        } else {
          bail(e); // Abort retry for other errors
        }
      }
    }, RETRY_OPTIONS).catch(e => {
      if (e.message === STILL_OPENED_ERROR_MESSAGE) {
        throw e;
      }
    });
  }

  async selectNetwork(name: string) {
    const networkItemElem = await findElement(NetworkSelectSelectors.networkItemButton, { name });

    await networkItemElem.click();
  }
}
