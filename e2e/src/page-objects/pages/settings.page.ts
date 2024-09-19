import { SettingsSelectors } from 'src/app/pages/Settings/Settings.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class SettingsPage extends Page {
  generalButton = createPageElement(SettingsSelectors.generalButton);
  synchronizationButton = createPageElement(SettingsSelectors.synchronizationButton);
  addressBookButton = createPageElement(SettingsSelectors.addressBookButton);
  revealPrivateKeyButton = createPageElement(SettingsSelectors.revealPrivateKeyButton);
  revealSeedPhraseButton = createPageElement(SettingsSelectors.revealSeedPhraseButton);
  dappsButton = createPageElement(SettingsSelectors.dAppsButton);
  networksButton = createPageElement(SettingsSelectors.networksButton);
  removeAccountButton = createPageElement(SettingsSelectors.removeAccountButton);
  aboutButton = createPageElement(SettingsSelectors.aboutButton);

  async isVisible() {
    await this.generalButton.waitForDisplayed();
    await this.synchronizationButton.waitForDisplayed();
    await this.addressBookButton.waitForDisplayed();
    await this.revealPrivateKeyButton.waitForDisplayed();
    await this.revealSeedPhraseButton.waitForDisplayed();
    await this.dappsButton.waitForDisplayed();
    await this.networksButton.waitForDisplayed();
    await this.removeAccountButton.waitForDisplayed();
    await this.aboutButton.waitForDisplayed();
  }
}
