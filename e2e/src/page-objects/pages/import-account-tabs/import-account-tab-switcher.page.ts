import { ImportAccountSelectors } from 'src/app/pages/ImportAccount/selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement, findElements, getElementText } from 'e2e/src/utils/search.utils';

export class ImportAccountTab extends Page {
  tabSwitcher = createPageElement(ImportAccountSelectors.tabSwitcher);

  async isVisible() {
    await this.tabSwitcher.waitForDisplayed();
  }
  async selectTab(tabName: string) {
    const tabElements = await findElements(ImportAccountSelectors.tabSwitcher);

    for (const tabElement of tabElements) {
      const getTabValue = await getElementText(tabElement);

      if (getTabValue === tabName) {
        await tabElement.click();
      }
    }
  }
}
