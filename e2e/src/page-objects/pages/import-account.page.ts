import { ImportAccountTestIds } from '../../../../src/app/pages/ImportAccount/ImportAccount.test-ids';
import { Page } from '../../classes/page.class';
import { createPageElement, findElements } from '../../utils/search.utils';

export class ImportAccountTab extends Page {
  tabSwitcher = createPageElement(ImportAccountTestIds.tabSwitcher);

  async isVisible() {
    await this.tabSwitcher.waitForDisplayed();
  }
}

export class ImportAccountPrivateKeyTab extends Page {
  privateKeyInput = createPageElement(ImportAccountTestIds.privateKeyInput);
  privateKeyImportButton = createPageElement(ImportAccountTestIds.privateKeyImportButton);

  async isVisible() {
    await this.privateKeyInput.waitForDisplayed();
    await this.privateKeyImportButton.waitForDisplayed();
  }
}

export class ImportAccountMnemonicTab extends Page {
  mnemonicWordInput = createPageElement(ImportAccountTestIds.mnemonicWordInput);
  mnemonicPasswordField = createPageElement(ImportAccountTestIds.mnemonicPasswordField);
  mnemonicImportButton = createPageElement(ImportAccountTestIds.mnemonicImportButton);

  async isVisible() {
    await this.mnemonicWordInput.waitForDisplayed();
    await this.mnemonicPasswordField.waitForDisplayed();
    await this.mnemonicImportButton.waitForDisplayed();
  }

  async enterSeedPhrase(seedPhrase: string) {
    const wordsArray = seedPhrase.split(' ');
    const wordsInputs = await findElements(ImportAccountTestIds.mnemonicWordInput);

    for (let i = 0; i < wordsArray.length; i++) {
      const word = wordsArray[i];
      const input = wordsInputs[i];

      await input.type(word);
    }
  }
}

export class ImportAccountWatchOnlyTab extends Page {
  watchOnlyInput = createPageElement(ImportAccountTestIds.watchOnlyInput);
  watchOnlyImportButton = createPageElement(ImportAccountTestIds.watchOnlyImportButton);

  async isVisible() {
    await this.watchOnlyInput.waitForDisplayed();
    await this.watchOnlyImportButton.waitForDisplayed();
  }
}
