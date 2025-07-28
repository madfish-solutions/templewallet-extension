import { BasicChain } from 'temple/front/chains';

export type FilterChain = BasicChain | null;

export interface AssetsFilterOptionsStateInterface {
  filterChain: FilterChain;
  tokensListOptions: {
    /** @deprecated */
    hideZeroBalance?: boolean;
    hideSmallBalance: boolean;
    groupByNetwork: boolean;
  };
  collectiblesListOptions: {
    blur: boolean;
    showInfo: boolean;
  };
}

export const AssetsFilterOptionsInitialState: AssetsFilterOptionsStateInterface = {
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
