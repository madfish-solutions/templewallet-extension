import { createPageElement } from '../../utils/search.utils';
import { Page } from '../page.class';

export class ImportExistingWalletPage extends Page {
  seedPhraseInput = createPageElement('ImportWalletFromSeedPhraseSelectors.SeedPhraseInput');
  nextButton = createPageElement('ImportWalletFromSeedPhraseSelectors.NextButton');

  async isVisible() {
    await this.seedPhraseInput.waitForDisplayed();
    await this.nextButton.waitForDisplayed();
  }
}
