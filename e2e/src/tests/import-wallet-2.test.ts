import { setWalletPasswordSelectors } from 'src/app/pages/NewWallet/setWalletPassword/SetWalletPassword.selectors';
import { ManualBackupModalSelectors } from 'src/app/templates/ManualBackupModal/selectors';

import { CustomBrowserContext } from 'e2e/src/classes/browser-context.class';
import { findElements } from 'e2e/src/utils/search.utils';
import { sleep } from 'e2e/src/utils/timing.utils';

import { test } from '../fixtures/extension';
import { describeScenario } from '../fixtures/hooks';
import { Pages } from '../page-objects';
import { envVars } from '../utils/env.utils';

describeScenario('Create new wallet', () => {
  test('Create new wallet: positive', { tag: '@create' }, async () => {
    await Pages.Welcome.isVisible();
    await Pages.Welcome.createNewWalletButton.waitForDisplayed();
    await Pages.Welcome.createNewWalletButton.click();

    await Pages.SetWallet.passwordField.fill(envVars.DEFAULT_PASSWORD);
    await Pages.SetWallet.repeatPasswordField.fill(envVars.DEFAULT_PASSWORD);
    await Pages.SetWallet.createButton.click();

    await CustomBrowserContext.page.getByTestId('Backup Options Modal/Manual Backup Button').click();
    await CustomBrowserContext.page.getByTestId('lalala').focus();
    await CustomBrowserContext.page.getByTestId('lalala').click();
    await sleep(2000);
    const seedValue = (await CustomBrowserContext.page.getByTestId('lalala').textContent()) as string;
    console.log('seed:       ', seedValue);
    const seedValueArray = seedValue?.split(' ');

    await Pages.ManualBackupModal.notedDownButton.click();
    await sleep(2000);

    const wordsButtonArray = await findElements(ManualBackupModalSelectors.seedWordButton);
    console.log('words buutons count is ', wordsButtonArray.length);

    const wordsIndexArray = await findElements(ManualBackupModalSelectors.wordIndex);
    console.log('index count is ', wordsIndexArray.length);

    for (let wordIndex = 0; wordIndex < wordsButtonArray.length; wordIndex++) {
      const wordIndexValue = await wordsIndexArray[wordIndex].textContent().then((text: string) => {
        return Number(text.replace('.', ''));
      });

      console.log('pure index is', wordIndexValue);

      for (let wordIndex = 1; wordIndex < seedValueArray.length * 3; wordIndex++) {
        if (wordIndex === wordIndexValue) {
          console.log('match??', seedValueArray[wordIndexValue - 1]);

          for (let seedWordIndex = 0; seedWordIndex < wordsButtonArray.length; seedWordIndex++) {
            const seedWordButtonValue = wordsButtonArray[seedWordIndex];
            if ((await seedWordButtonValue.textContent()) == seedValueArray[wordIndexValue - 1]) {
              await seedWordButtonValue.click();
            }
          }
        }
      }
    }
    await sleep(500000);
  });
});
