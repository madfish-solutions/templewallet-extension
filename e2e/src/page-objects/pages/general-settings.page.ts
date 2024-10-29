import { SettingsGeneralSelectors } from 'src/app/templates/SettingsGeneral/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class GeneralSettingsPage extends Page {
  languageitem = createPageElement(SettingsGeneralSelectors.languageItem);
  languageDropDown = createPageElement(SettingsGeneralSelectors.languageDropDown);
  currencyItem = createPageElement(SettingsGeneralSelectors.currencyItem);
  currencyDropDown = createPageElement(SettingsGeneralSelectors.currencyDropDown);
  popUpCheckBox = createPageElement(SettingsGeneralSelectors.popUpCheckBox);
  notificationCheckBox = createPageElement(SettingsGeneralSelectors.notificationCheckBox);

  async isVisible() {
    await this.languageDropDown.waitForDisplayed();
    await this.currencyDropDown.waitForDisplayed();
    await this.popUpCheckBox.waitForDisplayed();
    await this.notificationCheckBox.waitForDisplayed();
  }
}
