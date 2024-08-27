import { test } from '../fixtures/extension';
import { describeScenario } from '../fixtures/hooks';
import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';
import { importWalletPrecondition } from '../utils/shared.utils';
import { sleep } from '../utils/timing.utils';

describeScenario('Import Wallet Internal @internal', () => {
  test('Import Wallet Internal: positive scenario', async () => {
    await importWalletPrecondition();

    await Pages.Home.accountIcon.click();
    await Pages.AccountsModal.isVisible();
    await Pages.AccountsModal.newWalletActionsButton.click();
    await Pages.AddNewWalletList.isVisible();
    await Pages.AddNewWalletList.importWallet.click();
    await Pages.ImportAccountMnemonicTab.enterSeedPhrase(envVars.IMPORTED_HD_ACCOUNT_SEED_PHRASE);
    await Pages.ImportAccountMnemonicTab.walletFromMnemonicImportButton.click();
    await sleep(5000);
  });
});
