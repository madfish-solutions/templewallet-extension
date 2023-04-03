import { SendFormSelectors } from '../../../../src/app/templates/SendForm/selectors';
import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class SendPage extends Page {
  assetDropDown = createPageElement(SendFormSelectors.assetDropDown);
  assetName = createPageElement(SendFormSelectors.assetName);
  assetDropDownSearchInput = createPageElement(SendFormSelectors.assetDropDownSearchInput);
  amountInput = createPageElement(SendFormSelectors.amountInput);

  async isVisible() {}
}
