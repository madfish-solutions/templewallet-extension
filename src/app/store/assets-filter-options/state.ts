import { BasicChain } from 'temple/front/chains';

export type FilterChain = BasicChain | null;

export interface ModeOptions {
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

export interface AssetsFilterOptionsStateInterface extends ModeOptions {
  storedMainnetOptions: ModeOptions;
  storedTestnetOptions: ModeOptions;
}

export const modeOptionsInitialState: ModeOptions = {
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

export const AssetsFilterOptionsInitialState: AssetsFilterOptionsStateInterface = {
  ...modeOptionsInitialState,
  storedMainnetOptions: modeOptionsInitialState,
  storedTestnetOptions: modeOptionsInitialState
};
