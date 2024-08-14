import { NetworkSettingsSelectors as CustomNetworkSettingsSelectors } from 'src/app/pages/Settings/Networks/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

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
}
