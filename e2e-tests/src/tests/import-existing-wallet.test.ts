import {test, expect } from 'e2e/src/fixtures/extension2';
import { CustomBrowserContext } from '../classes/browser-context.class';
import { sleep } from "e2e/src/utils/timing.utils";
import { Pages } from "../page-objects/index";
import { switchToPage } from "src/utils/shared.utils";
import { envVars } from "src/utils/env.utils";
import { page } from "e2e/src/fixtures/extension";
// import { test2 } from "e2e/src/fixtures/extension2";



test.describe('Example', () => {
  test('f1111', async ({ }) => {

    console.log('first precondition test', );

    await page.goto('https://jabko.ua/ipad/ipad-air-10-5/apple-ipad-air--2022-/apple-ipad-air--64gb--wi-fi--blue--2022-')
    await new Promise(res => setTimeout(res, 2000));
  });

  test('FG Extension ID', async ({ extensionId }) => {
    console.log('Extension ID:', extensionId);

    await page.goto('https://github.com/madfish-solutions/templewallet-extension/pull/1143/files')
    await new Promise(res => setTimeout(res, 2000));
  });

  test('TW.com Title', async () => {
    await page.goto('https://templewallet.com/');

    await new Promise(res => setTimeout(res, 2000));

    await expect(page).toHaveTitle(
      'Temple Wallet - Cryptocurrency wallet for the Tezos blockchain | Temple - Tezos Wallet'
    );
  });
  test('import existing wallet', async ({ context }) => {
    await sleep(3000)

    await context.newPage()

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



    await sleep(5000)

  });


  test('FG Extension ID2', async ({  }) => {
    console.log('Extension ID:');

    await new Promise(res => setTimeout(res, 5000));


  });

  test.afterEach(async ({ context }) => {
    await context.close()
  })

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
