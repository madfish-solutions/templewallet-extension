import retry from 'async-retry';
import { NetworkSettingsSelectors as CustomNetworkSettingsSelectors } from 'src/app/pages/Settings/Networks/selectors';

import { RETRY_OPTIONS, VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Page } from '../../classes/page.class';
import { createPageElement, findElement } from '../../utils/search.utils';

export class NetworksPage extends Page {
  networkItem = createPageElement(CustomNetworkSettingsSelectors.networkItem);
  deleteCustomNetworkButton = createPageElement(CustomNetworkSettingsSelectors.deleteCustomNetworkButton);
  nameInput = createPageElement(CustomNetworkSettingsSelectors.nameInput);
  RPCbaseURLinput = createPageElement(CustomNetworkSettingsSelectors.RPCbaseURLinput);
  addNetworkButton = createPageElement(CustomNetworkSettingsSelectors.addNetworkButton);

  async isVisible() {
    await this.networkItem.waitForDisplayed();
    await this.nameInput.waitForDisplayed();
    await this.RPCbaseURLinput.waitForDisplayed();
    await this.addNetworkButton.waitForDisplayed();
  }

  async isCustomNetworkAdded(url: string) {
    await findElement(
      CustomNetworkSettingsSelectors.networkItem,
      { url },
      VERY_SHORT_TIMEOUT,
      `The custom network with address: '${url}' not found`
    );

    const deleteCustomNetworkButton = await findElement(
      CustomNetworkSettingsSelectors.deleteCustomNetworkButton,
      { url },
      VERY_SHORT_TIMEOUT,
      `The delete custom network button related to address: '${url}' not found`
    );

    return deleteCustomNetworkButton;
  }

  async clickDeleteCustomNetwork(url: string) {
    const customNetworkDeleteBtn = await this.isCustomNetworkAdded(url);
    await customNetworkDeleteBtn.click();
  }

  async isCustomNetworkDeleted(url: string) {
    await retry(
      () =>
        this.isCustomNetworkAdded(url).then(
          () => {
            throw new Error(`The custom network '${url}' not deleted`);
          },
          () => undefined
        ),
      RETRY_OPTIONS
    );
  }
}
