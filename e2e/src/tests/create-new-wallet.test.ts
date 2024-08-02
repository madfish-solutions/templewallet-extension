import { CustomBrowserContext } from '../classes/browser-context.class';
import { test } from '../fixtures/extension';
import { describeScenario } from '../fixtures/hooks';
import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';

describeScenario('Create new wallet', () => {
  test('Create new wallet: positive', { tag: '@create-wallet' }, async () => {
    await Pages.Welcome.createNewWalletButton.waitForDisplayed();
    await Pages.Welcome.createNewWalletButton.click();

    await Pages.SetWallet.passwordField.fill(envVars.DEFAULT_PASSWORD);
    await Pages.SetWallet.repeatPasswordField.fill(envVars.DEFAULT_PASSWORD);
    await Pages.SetWallet.createButton.click();

    await Pages.BackupOptionsModal.isVisible();
    await Pages.BackupOptionsModal.manualBackupButton.click();

    await Pages.ManualBackupModal.isVisible('Backup');
    await Pages.ManualBackupModal.protectedMask.focus();
    await Pages.ManualBackupModal.protectedMask.click();

    CustomBrowserContext.SEED_PHRASE = await Pages.ManualBackupModal.protectedMask.getValue();

    await Pages.ManualBackupModal.notedDownButton.click();

    await Pages.ManualBackupModal.isVisible('Verify');
    await Pages.ManualBackupModal.verifyMnemonic();
    await Pages.ManualBackupModal.confirmButton.click();

    await Pages.OnRumpModal.isVisible();
    await Pages.OnRumpModal.closeButton.click();

    await Pages.NewsletterModal.isVisible();
    await Pages.NewsletterModal.closeButton.click();

    // TODO: Home page object will need additional rework after EVM implementation
    await Pages.Home.isVisible();
  });
});
