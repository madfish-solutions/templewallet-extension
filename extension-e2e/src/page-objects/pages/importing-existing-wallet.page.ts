import { ImportFromSeedPhraseTestIds } from '../../../../src/app/pages/NewWallet/import/ImportSeedPhrase/ImportFromSeedPhrase.test-ids';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class ImportExistingWalletPage extends Page {
  nextButton = createPageElement(ImportFromSeedPhraseTestIds.nextButton);

  async isVisible() {
    await this.nextButton.waitForDisplayed();
  }
}
