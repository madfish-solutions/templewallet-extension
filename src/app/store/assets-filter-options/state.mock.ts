import { mockPersistedState } from 'lib/store';

import { AssetsFilterOptionsStateInterface, DefaultTokensFilterOptions } from './state';

export const mockAssetsFilterOptionsState = mockPersistedState<AssetsFilterOptionsStateInterface>({
  tokensOptions: DefaultTokensFilterOptions
});
