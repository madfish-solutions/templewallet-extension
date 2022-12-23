import { SettingsSelectors } from '../../../../src/app/pages/Settings.selectors';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class SettingsPage extends Page {
  generalButton = createPageElement(SettingsSelectors.GeneralButton);
  synchronizationButton = createPageElement(SettingsSelectors.SynchronizationButton);
  addressBookButton = createPageElement(SettingsSelectors.AddressBookButton);
  revealPrivateKeyButton = createPageElement(SettingsSelectors.RevealPrivateKeyButton);
  revealSeedPhraseButton = createPageElement(SettingsSelectors.RevealSeedPhraseButton);
  dappsButton = createPageElement(SettingsSelectors.DAppsButton);
  networksButton = createPageElement(SettingsSelectors.NetworksButton);
  activateAccountButton = createPageElement(SettingsSelectors.ActivateAccountButton);
  removeAccountButton = createPageElement(SettingsSelectors.RemoveAccountButton);
  aboutButton = createPageElement(SettingsSelectors.AboutButton);

  async isVisible() {
    await this.generalButton.waitForDisplayed();
    await this.synchronizationButton.waitForDisplayed();
    await this.addressBookButton.waitForDisplayed();
    await this.revealPrivateKeyButton.waitForDisplayed();
    await this.revealSeedPhraseButton.waitForDisplayed();
    await this.dappsButton.waitForDisplayed();
    await this.networksButton.waitForDisplayed();
    await this.activateAccountButton.waitForDisplayed();
    await this.removeAccountButton.waitForDisplayed();
    await this.aboutButton.waitForDisplayed();
  }
}
