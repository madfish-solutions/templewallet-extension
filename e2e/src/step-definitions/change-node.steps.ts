import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { Pages } from 'e2e/src/page-objects';
import { MEDIUM_TIMEOUT, sleep } from 'e2e/src/utils/timing.utils';

Given(
  /I select (.*) node in the networks drop-down list on the Header page/,
  { timeout: MEDIUM_TIMEOUT },
  async (networkName: string) => {
    await Pages.NetworksDropDown.selectNetwork(networkName);
  }
);

Given(/I check that (.*) node is selected correctly/, { timeout: MEDIUM_TIMEOUT }, async (networkName: string) => {
  // need a little timeout to wait until changed node is loaded
  await sleep(1500);

  const networkButtonName = await Pages.Header.selectedNetworkButtonName.getText();
  expect(networkButtonName).eql(networkName);

  await Pages.Header.templeLogoButton.waitForDisplayed();
  await Pages.Header.accountIconButton.waitForDisplayed();
  await Pages.Home.ReceiveButton.waitForDisplayed();
  await Pages.Home.SwapButton.waitForDisplayed();
  await Pages.Home.SendButton.waitForDisplayed();
});
