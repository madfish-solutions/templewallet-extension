import retry from 'async-retry';
import { AlertSelectors } from 'src/app/atoms/Alert.selectors';
import { UnlockSelectors } from 'src/app/pages/Unlock/Unlock.selectors';

import { VERY_SHORT_TIMEOUT } from 'e2e/src/utils/timing.utils';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class UnlockScreenPage extends Page {
  passwordInput = createPageElement(UnlockSelectors.passwordInput);
  unlockButton = createPageElement(UnlockSelectors.unlockButton);
  importWalletUsingSeedPhrase = createPageElement(UnlockSelectors.importWalletUsingSeedPhrase);
  alertTitle = createPageElement(AlertSelectors.alertTitle);

  async isVisible() {
    await this.passwordInput.waitForDisplayed();
    await this.unlockButton.waitForDisplayed();
    await this.importWalletUsingSeedPhrase.waitForDisplayed();
  }

  async isTimeErrorDisplayed() {
    await retry(
      async () =>
        await this.alertTitle.waitForDisplayed(VERY_SHORT_TIMEOUT).then(
          () => {
            throw new Error(`The time lock error is still displayed over a minute`);
          },
          () => undefined
        ),
      // checking every 10 seconds for 65 seconds to see if the time lock error persists
      { minTimeout: 10_000, maxTimeout: 10_000, maxRetryTime: 65_000 }
    );
  }
}
