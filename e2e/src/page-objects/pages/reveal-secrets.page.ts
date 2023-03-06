import { RevealSecretsSelectors } from '../../../../src/app/templates/RevealSecrets/RevealSecrets.selectors';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class RevealSecretsPage extends Page {
  revealButton = createPageElement(RevealSecretsSelectors.RevealButton);
  revealPasswordField = createPageElement(RevealSecretsSelectors.RevealPasswordInput);
  revealSecretsValue = createPageElement(RevealSecretsSelectors.RevealSecretsValue);

  async isVisible() {
    await this.revealButton.waitForDisplayed();
    await this.revealPasswordField.waitForDisplayed();
  }
}
