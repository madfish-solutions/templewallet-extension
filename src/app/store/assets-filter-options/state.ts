import { TempleChainKind } from 'temple/types';

interface EvmChain {
  kind: TempleChainKind.EVM;
  chainId: number;
}

interface TezosChain {
  kind: TempleChainKind.Tezos;
  chainId: string;
}

export type FilterChain = EvmChain | TezosChain | null;

export interface AssetsFilterOptionsStateInterface {
  filterChain: FilterChain;
  tokensListOptions: {
    hideZeroBalance: boolean;
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
    hideZeroBalance: false,
    groupByNetwork: false
  },
  collectiblesListOptions: {
    blur: false,
    showInfo: false
  }
};
