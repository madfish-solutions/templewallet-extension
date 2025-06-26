import { mockPersistedState } from 'lib/store';

import { AssetsFilterOptionsStateInterface } from './state';

export const mockAssetsFilterOptionsState = mockPersistedState<AssetsFilterOptionsStateInterface>({
  filterChain: null,
  tokensListOptions: {
    hideZeroBalance: false,
    groupByNetwork: false
  },
  collectiblesListOptions: {
    blur: false,
    showInfo: false
  }
});
