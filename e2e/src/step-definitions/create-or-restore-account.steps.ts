import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';

import { IEnterValuesKey, iEnterValues } from 'e2e/../../../e2e-tests/src/utils/input-data.utils';
import { MEDIUM_TIMEOUT } from 'e2e/../../../e2e-tests/src/utils/timing.utils';

import { Pages } from '../../../e2e-tests/src/page-objects';

Given(
  /I check if (.*) is edited name for created account/,
  { timeout: MEDIUM_TIMEOUT },
  async (editedName: IEnterValuesKey) => {
    const nameOfCreatedAccount = await Pages.Home.accountNameText.getText();

    expect(nameOfCreatedAccount).eql(iEnterValues[editedName]);
  }
);
