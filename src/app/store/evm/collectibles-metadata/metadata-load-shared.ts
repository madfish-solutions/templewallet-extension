import { Action } from 'redux';
import { EMPTY } from 'rxjs';

import {
  setAssetsFilterChain,
  setCollectiblesViewAsCollectionsFilterOption
} from 'app/store/assets-filter-options/actions';
import { isAbortError } from 'lib/apis/utils';

export const isCollectiblesListingChange = (action: Action) =>
  setAssetsFilterChain.match(action) || setCollectiblesViewAsCollectionsFilterOption.match(action);

export const emptyAfterLoadError = (error: unknown) => {
  if (!isAbortError(error)) console.error(error);

  return EMPTY;
};
