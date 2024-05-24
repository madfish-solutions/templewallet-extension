import { EXTENSION_ID, test, expect, page } from 'e2e/src/fixtures/extension';
import { CustomBrowserContext } from '../classes/browser-context.class';
import { sleep } from "e2e/src/utils/timing.utils";
import { Pages } from "../page-objects/index";
import { switchToPage } from "src/utils/shared.utils";
import { envVars } from "src/utils/env.utils";

test.describe('Example', () => {
  test('import existing wallet', async ({  }) => {
    await sleep(3000)

    await switchToPage(`chrome-extension://`)
    await Pages.Welcome.importExistingWalletButton.waitForDisplayed()
    await Pages.Welcome.importExistingWalletButton.click()
    await Pages.ImportExistingWallet.enterSeedPhrase(envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE)
    await Pages.ImportExistingWallet.nextButton.click()
    await Pages.SetWallet.passwordField.fill(envVars.DEFAULT_PASSWORD)
    await Pages.SetWallet.repeatPasswordField.fill(envVars.DEFAULT_PASSWORD)
    await Pages.SetWallet.skipOnboarding.click()
    await Pages.SetWallet.acceptTerms.click()
    await Pages.SetWallet.importButton.click()
    await Pages.NewsletterModal.closeButton.click()

    await Pages.Home.isVisible()


    await sleep(5000)

  });

  //
  // test('FG Extension ID', async ({ extensionId }) => {
  //   console.log('Extension ID:', extensionId);
  //
  //   await new Promise(res => setTimeout(res, 5000));
  //
  //
  // });
  //
  // test('TW.com Title', async () => {
  //   await page.goto('https://templewallet.com/');
  //
  //   await new Promise(res => setTimeout(res, 2000));
  //
  //   await expect(page).toHaveTitle(
  //     'Temple Wallet - Cryptocurrency wallet for the Tezos blockchain | Temple - Tezos Wallet'
  //   );
  // });
});
