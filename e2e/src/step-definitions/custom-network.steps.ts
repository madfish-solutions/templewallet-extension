import { Given } from '@cucumber/cucumber';

import { Pages } from 'e2e/src/page-objects';
import { IEnterValuesKey, iEnterValues } from 'e2e/src/utils/input-data.utils';
import { MEDIUM_TIMEOUT } from 'e2e/src/utils/timing.utils';

Given(
  /I check if added custom network = '(.*)' is displayed on 'Current networks' list/,
  { timeout: MEDIUM_TIMEOUT },
  async (networkUrl: IEnterValuesKey) => {
    const customNetworkUrl = iEnterValues[networkUrl];

    if (customNetworkUrl === undefined) throw new Error(`${networkUrl} key doesn't exist in the 'iEnterValues' object`);

    await Pages.Networks.isCustomNetworkAdded(customNetworkUrl);
  }
);

Given(
  /I find an added custom network = '(.*)' and click to delete it/,
  { timeout: MEDIUM_TIMEOUT },
  async (networkUrl: IEnterValuesKey) => {
    const customNetworkUrl = iEnterValues[networkUrl];

    if (customNetworkUrl === undefined) throw new Error(`${networkUrl} key doesn't exist in the 'iEnterValues' object`);

    await Pages.Networks.clickDeleteCustomNetwork(customNetworkUrl);
  }
);

Given(
  /I check if added custom network = '(.*)' is deleted from the 'Current networks' list/,
  { timeout: MEDIUM_TIMEOUT },
  async (networkUrl: IEnterValuesKey) => {
    const customNetworkUrl = iEnterValues[networkUrl];

    if (customNetworkUrl === undefined) throw new Error(`${networkUrl} key doesn't exist in the 'iEnterValues' object`);

    await Pages.Networks.isCustomNetworkDeleted(customNetworkUrl);
  }
);
