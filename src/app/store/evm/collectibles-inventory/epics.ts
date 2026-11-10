import { combineEpics } from 'redux-observable';

import { loadCollectionTokensEpic } from './load-collection-tokens';
import { loadInventoryEpic, loadNextPageEpic } from './load-inventory';
import { searchEpic } from './search-inventory';

export const evmCollectiblesInventoryEpics = combineEpics(
  loadInventoryEpic,
  loadNextPageEpic,
  loadCollectionTokensEpic,
  searchEpic
);
