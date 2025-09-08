import { AssetsFilterOptionsStateInterface } from './state';

export const mockAssetsFilterOptionsState: AssetsFilterOptionsStateInterface = {
  filterChain: null,
  tokensListOptions: {
    hideSmallBalance: false,
    groupByNetwork: false
  },
  collectiblesListOptions: {
    blur: false,
    showInfo: false
  }
};
