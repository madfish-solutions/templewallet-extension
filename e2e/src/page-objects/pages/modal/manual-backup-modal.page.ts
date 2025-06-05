import { ManualBackupModalSelectors } from 'src/app/templates/manual-backup-modal-content/selectors';

import { CustomBrowserContext } from '../../../classes/browser-context.class';
import { Page } from '../../../classes/page.class';
import { createPageElement, findElements } from '../../../utils/search.utils';

export class ManualBackupModalPage extends Page {
  confirmButton = createPageElement(ManualBackupModalSelectors.confirmButton);
  notedDownButton = createPageElement(ManualBackupModalSelectors.notedDownButton);
  protectedMask = createPageElement(ManualBackupModalSelectors.protectedMask);
  wordIndex = createPageElement(ManualBackupModalSelectors.wordIndex);
  seedWordButton = createPageElement(ManualBackupModalSelectors.seedWordButton);

  async isVisible(modalPage: string) {
    if (modalPage == 'Backup') {
      await this.notedDownButton.waitForDisplayed();
      await this.protectedMask.waitForDisplayed();
    }

    if (modalPage == 'Verify') {
      await this.confirmButton.waitForDisplayed();
      await this.wordIndex.findElements(3);
      await this.seedWordButton.findElements(3);
    }
  }

  async verifyMnemonic() {
    const seedValueArray = CustomBrowserContext.SEED_PHRASE?.split(' ');

    const wordsButtonArray = await findElements(ManualBackupModalSelectors.seedWordButton);

    const wordsIndexArray = await findElements(ManualBackupModalSelectors.wordIndex);

    for (let wordIndex = 0; wordIndex < wordsButtonArray.length; wordIndex++) {
      const wordIndexValue = await wordsIndexArray[wordIndex].textContent().then((text: string | null) => {
        if (text === null) throw new Error('word index is null');
        return Number(text.replace('.', ''));
      });

      for (let wordIndex = 1; wordIndex < seedValueArray.length * wordsButtonArray.length; wordIndex++) {
        if (wordIndex === wordIndexValue) {
          for (let seedWordIndex = 0; seedWordIndex < wordsButtonArray.length; seedWordIndex++) {
            const seedWordButtonValue = wordsButtonArray[seedWordIndex];

            if ((await seedWordButtonValue.textContent()) == seedValueArray[wordIndexValue - 1]) {
              await seedWordButtonValue.click();
            }
          }
        }
      }
    }
  }
}
