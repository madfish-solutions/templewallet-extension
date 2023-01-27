import { NewSeedBackupTestIds } from '../../../../src/app/pages/NewWallet/create/NewSeedBackup/NewSeedBackup.test-ids';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class NewSeedBackupPage extends Page {
  protectedMask = createPageElement(NewSeedBackupTestIds.protectedMask);
  seedPhraseValue = createPageElement(NewSeedBackupTestIds.seedPhraseValue);
  iMadeSeedPhraseBackupCheckBox = createPageElement(NewSeedBackupTestIds.iMadeSeedPhraseBackupCheckBox);
  nextButton = createPageElement(NewSeedBackupTestIds.nextButton);

  async isVisible() {
    await this.protectedMask.waitForDisplayed();
    await this.seedPhraseValue.waitForDisplayed();
    await this.iMadeSeedPhraseBackupCheckBox.waitForDisplayed();
    await this.nextButton.waitForDisplayed();
  }
}
