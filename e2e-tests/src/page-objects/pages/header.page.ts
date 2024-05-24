import { HeaderSelectors } from 'src/app/layouts/PageLayout/Header.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class HeaderPage extends Page {
  accountIconButton = createPageElement(HeaderSelectors.accountIcon);
  templeLogoButton = createPageElement(HeaderSelectors.templeLogoIcon);

  async isVisible() {
    await this.accountIconButton.waitForDisplayed();
    await this.templeLogoButton.waitForDisplayed();
  }
}
