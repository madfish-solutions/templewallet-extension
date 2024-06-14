import { BakingSectionSelectors } from 'src/app/pages/Home/OtherComponents/BakingSection/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class DelegateTab extends Page {
  reDelegateButton = createPageElement(BakingSectionSelectors.reDelegateButton);
  delegatedBakerName = createPageElement(BakingSectionSelectors.delegatedBakerName);

  async isVisible() {
    await this.reDelegateButton.waitForDisplayed();
    await this.delegatedBakerName.waitForDisplayed();
  }
}
