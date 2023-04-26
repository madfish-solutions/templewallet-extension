import { HeaderSelectors } from 'src/app/layouts/PageLayout/Header.selectors';
import { NetworkSelectSelectors } from 'src/app/layouts/PageLayout/Header/NetworkSelect/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class HeaderPage extends Page {
  accountIconButton = createPageElement(HeaderSelectors.accountIcon);
  templeLogoButton = createPageElement(HeaderSelectors.templeLogoIcon);
  selectedNetworkButton = createPageElement(NetworkSelectSelectors.selectedNetworkButton);
  selectedNetworkButtonName = createPageElement(NetworkSelectSelectors.selectedNetworkButtonName);

  async isVisible() {
    await this.accountIconButton.waitForDisplayed();
    await this.templeLogoButton.waitForDisplayed();
    await this.selectedNetworkButton.waitForDisplayed();
    await this.selectedNetworkButtonName.waitForDisplayed();
  }
}
