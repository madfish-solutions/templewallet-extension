import { NewSeedBackupSelectors } from 'src/app/pages/NewWallet/create/NewSeedBackup/NewSeedBackup.selectors';

import { Page } from 'e2e/src/classes/page.class';
import { createPageElement } from 'e2e/src/utils/search.utils';

export class NewSeedBackupPage extends Page {
  protectedMask = createPageElement(NewSeedBackupSelectors.protectedMask);
  seedPhraseValue = createPageElement(NewSeedBackupSelectors.seedPhraseValue);
  iMadeSeedPhraseBackupCheckBox = createPageElement(NewSeedBackupSelectors.iMadeSeedPhraseBackupCheckBox);
  nextButton = createPageElement(NewSeedBackupSelectors.nextButton);

  async isVisible() {
    await this.protectedMask.waitForDisplayed();
    await this.seedPhraseValue.waitForDisplayed();
    await this.iMadeSeedPhraseBackupCheckBox.waitForDisplayed();
    await this.nextButton.waitForDisplayed();
  }
}
