import { SettingsGeneralSelectors } from 'src/app/templates/SettingsGeneral/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class GeneralSettingsPage extends Page {
  languageitem = createPageElement(SettingsGeneralSelectors.languageitem);
  languageDropDown = createPageElement(SettingsGeneralSelectors.languageDropDown);
  currencyItem = createPageElement(SettingsGeneralSelectors.currencyItem);
  currenctyDropDown = createPageElement(SettingsGeneralSelectors.currenctyDropDown);
  popUpCheckBox = createPageElement(SettingsGeneralSelectors.popUpCheckBox);
  extensionLockUpCheckBox = createPageElement(SettingsGeneralSelectors.extensionLockUpCheckBox);
  anonymousAnalyticsCheckBox = createPageElement(SettingsGeneralSelectors.anonymousAnalyticsCheckBox);
  notificationCheckBox = createPageElement(SettingsGeneralSelectors.notificationCheckBox);
  partnersPromotion = createPageElement(SettingsGeneralSelectors.partnersPromotion);

  async isVisible() {
    await this.languageDropDown.waitForDisplayed();
    await this.currenctyDropDown.waitForDisplayed();
    await this.popUpCheckBox.waitForDisplayed();
    await this.extensionLockUpCheckBox.waitForDisplayed();
    await this.anonymousAnalyticsCheckBox.waitForDisplayed();
    await this.notificationCheckBox.waitForDisplayed();
    await this.partnersPromotion.waitForDisplayed();
  }
}
