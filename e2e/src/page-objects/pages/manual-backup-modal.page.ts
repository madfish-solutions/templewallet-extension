import { ManualBackupModalSelectors } from 'src/app/templates/ManualBackupModal/selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class ManualBackupModalPage extends Page {
  confirmButton = createPageElement(ManualBackupModalSelectors.confirmButton);
  cancelButton = createPageElement(ManualBackupModalSelectors.cancelButton);
  notedDownButton = createPageElement(ManualBackupModalSelectors.notedDownButton);
  protectedMask = createPageElement(ManualBackupModalSelectors.protectedMask);
  wordIndex = createPageElement(ManualBackupModalSelectors.wordIndex);
  seedWordButton = createPageElement(ManualBackupModalSelectors.seedWordButton);

  async isVisible(modalPage: string) {
    if (modalPage == 'Backup your Seed Phrase') {
      await this.notedDownButton.waitForDisplayed();
      await this.protectedMask.waitForDisplayed();
    }

    if (modalPage == 'Verify Seed Phrase') {
      await this.confirmButton.waitForDisplayed();
      await this.cancelButton.waitForDisplayed();
      await this.wordIndex.waitForDisplayed();
      await this.seedWordButton.waitForDisplayed();
    }
  }
}
