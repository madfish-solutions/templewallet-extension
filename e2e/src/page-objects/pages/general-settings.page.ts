import { SettingsGeneralSelectors } from 'src/app/templates/SettingsGeneral/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class GeneralSettingsPage extends Page {
  languageitem = createPageElement(SettingsGeneralSelectors.languageitem);
  languageDropDown = createPageElement(SettingsGeneralSelectors.languageDropDown);
  currencyItem = createPageElement(SettingsGeneralSelectors.currencyItem);
  currenctyDropDown = createPageElement(SettingsGeneralSelectors.currenctyDropDown);
  blockExplorerItem = createPageElement(SettingsGeneralSelectors.blockExplorerItem);
  blockExplorerDropDown = createPageElement(SettingsGeneralSelectors.blockExplorerDropDown);
  popUpCheckBox = createPageElement(SettingsGeneralSelectors.popUpCheckBox);
  extensionLockUpCheckBox = createPageElement(SettingsGeneralSelectors.extensionLockUpCheckBox);
  anonymousAnalyticsCheckBox = createPageElement(SettingsGeneralSelectors.anonymousAnalyticsCheckBox);
  notificationCheckBox = createPageElement(SettingsGeneralSelectors.notificationCheckBox);
  partnersPromotion = createPageElement(SettingsGeneralSelectors.partnersPromotion);

  async isVisible() {
    await this.languageDropDown.waitForDisplayed();
    await this.currenctyDropDown.waitForDisplayed();
    await this.blockExplorerDropDown.waitForDisplayed();
    await this.popUpCheckBox.waitForDisplayed();
    await this.extensionLockUpCheckBox.waitForDisplayed();
    await this.anonymousAnalyticsCheckBox.waitForDisplayed();
    await this.notificationCheckBox.waitForDisplayed();
    await this.partnersPromotion.waitForDisplayed();
  }
}
