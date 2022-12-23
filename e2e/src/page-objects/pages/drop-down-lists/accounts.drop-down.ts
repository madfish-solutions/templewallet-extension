import { AccountDropdownSelectors } from '../../../../../src/app/layouts/PageLayout/Header/AccountDropdown.selectors';
import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class AccountsDropdown extends Page {
  accountItemButton = createPageElement(AccountDropdownSelectors.AccountItemButton);
  logoutButton = createPageElement(AccountDropdownSelectors.LogoutButton);
  createOrRestoreAccountButton = createPageElement(AccountDropdownSelectors.CreateOrRestoreAccountButton);
  importAccountButton = createPageElement(AccountDropdownSelectors.ImportAccountButton);
  connectLedgerButton = createPageElement(AccountDropdownSelectors.ConnectLedgerButton);
  dappsButton = createPageElement(AccountDropdownSelectors.DAppsButton);
  settingsButton = createPageElement(AccountDropdownSelectors.SettingsButton);

  async isVisible() {
    await this.accountItemButton.waitForDisplayed();
    await this.logoutButton.waitForDisplayed();
    await this.createOrRestoreAccountButton.waitForDisplayed();
    await this.importAccountButton.waitForDisplayed();
    await this.connectLedgerButton.waitForDisplayed();
    await this.dappsButton.waitForDisplayed();
    await this.settingsButton.waitForDisplayed();
  }
}
