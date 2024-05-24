import { AccountDropdownSelectors } from 'src/app/layouts/PageLayout/Header/AccountDropdown/selectors';

import { VERY_SHORT_TIMEOUT } from 'src/utils/timing.utils';

import { Page } from '../../../classes/page.class';
import { createPageElement, findElement } from '../../../utils/search.utils';

export class AccountsDropdown extends Page {
  accountItemButton = createPageElement(AccountDropdownSelectors.accountItemButton);
  accountAddressValue = createPageElement(AccountDropdownSelectors.accountAddressValue);
  logoutButton = createPageElement(AccountDropdownSelectors.logoutButton);
  createOrRestoreAccountButton = createPageElement(AccountDropdownSelectors.createOrRestoreAccountButton);
  importAccountButton = createPageElement(AccountDropdownSelectors.importAccountButton);
  connectLedgerButton = createPageElement(AccountDropdownSelectors.connectLedgerButton);
  dappsButton = createPageElement(AccountDropdownSelectors.dAppsButton);
  settingsButton = createPageElement(AccountDropdownSelectors.settingsButton);

  async isVisible() {
    await this.accountItemButton.waitForDisplayed();
    await this.accountAddressValue.waitForDisplayed();
    await this.logoutButton.waitForDisplayed();
    await this.createOrRestoreAccountButton.waitForDisplayed();
    await this.importAccountButton.waitForDisplayed();
    await this.connectLedgerButton.waitForDisplayed();
    await this.dappsButton.waitForDisplayed();
    await this.settingsButton.waitForDisplayed();
  }

}
