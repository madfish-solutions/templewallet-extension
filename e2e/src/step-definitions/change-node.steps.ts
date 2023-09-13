import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/src/page-objects';
import { MEDIUM_TIMEOUT, SHORT_TIMEOUT, sleep } from 'e2e/src/utils/timing.utils';

Given(
  /I select (.*) node in the networks drop-down list on the Header page/,
  { timeout: MEDIUM_TIMEOUT },
  async (networkName: string) => {
    await Pages.NetworksDropDown.selectNetwork(networkName);
  }
);

Given(/I check that (.*) node is selected correctly/, { timeout: MEDIUM_TIMEOUT }, async (networkName: string) => {
  await Pages.Header.selectedNetworkButtonName.waitForText(networkName, SHORT_TIMEOUT);
  // dropdown close animation
  await sleep(100);

  await Pages.Header.templeLogoButton.waitForDisplayed();
  await Pages.Header.accountIconButton.waitForDisplayed();
  await Pages.Home.ReceiveButton.waitForDisplayed();
  await Pages.Home.SwapButton.waitForDisplayed();
  await Pages.Home.SendButton.waitForDisplayed();
});
