import { RevealSecretsTestIDS } from '../../../../src/app/templates/RevealSecrets/RevealSecrets.test-ids';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class RevealSecretsPage extends Page {
  revealButton = createPageElement(RevealSecretsTestIDS.RevealButton);
  revealPasswordField = createPageElement(RevealSecretsTestIDS.RevealPasswordField);
  revealSecretsValue = createPageElement(RevealSecretsTestIDS.RevealSecretsValue);

  async isVisible() {
    await this.revealButton.waitForDisplayed();
    await this.revealPasswordField.waitForDisplayed();
  }
}
