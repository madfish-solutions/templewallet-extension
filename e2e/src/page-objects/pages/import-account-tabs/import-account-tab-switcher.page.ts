import { ImportAccountTestIds } from '../../../../../src/app/pages/ImportAccount/ImportAccount.test-ids';
import { Page } from '../../../classes/page.class';
import { createPageElement, findElements, getElementText } from '../../../utils/search.utils';

export class ImportAccountTab extends Page {
  tabSwitcher = createPageElement(ImportAccountTestIds.tabSwitcher);

  async isVisible() {
    await this.tabSwitcher.waitForDisplayed();
  }
  async selectTab(tabName: string) {
    const tabElements = await findElements(ImportAccountTestIds.tabSwitcher);

    for (const tabElement of tabElements) {
      const getTabValue = await getElementText(tabElement);

      if (getTabValue === tabName) {
        await tabElement.click();
      }
    }
  }
}
