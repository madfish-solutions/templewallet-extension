import { RevealSecretsSelectors } from 'src/app/templates/RevealSecrets/RevealSecrets.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class RevealSecretsPage extends Page {
  revealButton = createPageElement(RevealSecretsSelectors.RevealButton);
  revealPasswordField = createPageElement(RevealSecretsSelectors.RevealPasswordInput);
  revealSecretsProtectedMask = createPageElement(RevealSecretsSelectors.RevealSecretsProtectedMask);
  revealSecretsValue = createPageElement(RevealSecretsSelectors.RevealSecretsValue);

  async isVisible() {
    await this.revealButton.waitForDisplayed();
    await this.revealPasswordField.waitForDisplayed();
  }
}
