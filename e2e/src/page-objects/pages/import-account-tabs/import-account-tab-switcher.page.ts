import { Locator } from '@playwright/test';
import { ImportAccountSelectors } from 'src/app/pages/ImportAccount/selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement, findElements, getElementText } from '../../../utils/search.utils';

export class ImportAccountTab extends Page {
  tabSwitcher = createPageElement(ImportAccountSelectors.tabSwitcher);

  async isVisible() {
    await this.tabSwitcher.waitForDisplayed();
  }
  async selectTab(tabName: string) {
    const tabElements = await findElements(ImportAccountSelectors.tabSwitcher);

    for (const tabElement of tabElements) {
      const getTabValue = await tabElement.textContent();

      if (getTabValue === tabName) {
        await tabElement.click();
      }
    }
  }
}
