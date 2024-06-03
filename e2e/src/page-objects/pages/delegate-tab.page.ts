import { BakingSectionSelectors } from 'src/app/pages/Home/OtherComponents/BakingSection.selectors';
import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class DelegateTab extends Page {
  reDelegateButton = createPageElement(BakingSectionSelectors.reDelegateButton);
  delegatedBakerName = createPageElement(BakingSectionSelectors.delegatedBakerName);

  async isVisible() {
    await this.reDelegateButton.waitForDisplayed();
    await this.delegatedBakerName.waitForDisplayed();
  }
}
