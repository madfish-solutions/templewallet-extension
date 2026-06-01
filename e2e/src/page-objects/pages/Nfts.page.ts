import { NftsPageSelectors } from 'src/app/pages/Nfts/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class NftsPage extends Page {
  collectibleItemButton = createPageElement(NftsPageSelectors.collectibleItem);

  async isVisible() {
    await this.collectibleItemButton.waitForDisplayed();
  }
}
