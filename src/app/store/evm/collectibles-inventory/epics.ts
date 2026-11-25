import { combineEpics } from 'redux-observable';

import { loadCollectionTokensEpic, verifyShownCollectionTokensEpic } from './load-collection-tokens';
import { loadInventoryEpic, loadNextPageEpic } from './load-inventory';
import { searchEpic } from './search-inventory';

export const evmCollectiblesInventoryEpics = combineEpics(
  loadInventoryEpic,
  loadNextPageEpic,
  loadCollectionTokensEpic,
  verifyShownCollectionTokensEpic,
  searchEpic
);
