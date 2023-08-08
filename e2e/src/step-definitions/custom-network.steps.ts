import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/src/page-objects';
import { iEnterValues } from 'e2e/src/utils/input-data.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

type customNetworkVarName = 'customNetworkRPC';

Given(
  /I check if added custom network = '(.*)' is displayed on 'Current networks' list/,
  { timeout: MEDIUM_TIMEOUT },
  async (CustomNetworkName: customNetworkVarName) => {
    await Pages.Networks.isCustomNetworkAdded(iEnterValues[CustomNetworkName]);
  }
);
