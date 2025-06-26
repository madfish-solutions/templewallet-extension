import { BackupMnemonicOverlaySelectors } from 'src/app/layouts/PageLayout/BackupMnemonicOverlay/selectors';

import { Page } from '../../../classes/page.class';
import { createPageElement } from '../../../utils/search.utils';

export class BackupOptionsModalPage extends Page {
  manualBackupButton = createPageElement(BackupMnemonicOverlaySelectors.manualBackupButton);
  useGoogleDriveButton = createPageElement(BackupMnemonicOverlaySelectors.useGoogleDriveButton);

  async isVisible() {
    await this.manualBackupButton.waitForDisplayed();
    await this.useGoogleDriveButton.waitForDisplayed();
  }
}
