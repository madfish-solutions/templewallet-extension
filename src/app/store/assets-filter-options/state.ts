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

export const DefaultTokensFilterOptions: TokensFilterOptions = {
  filterChain: null,
  hideZeroBalance: false,
  groupByNetwork: false
};

export interface TokensFilterOptions {
  filterChain: FilterChain;
  hideZeroBalance: boolean;
  groupByNetwork: boolean;
}

export interface AssetsFilterOptionsStateInterface {
  tokensOptions: TokensFilterOptions;
}

export const AssetsFilterOptionsInitialState: AssetsFilterOptionsStateInterface = {
  tokensOptions: DefaultTokensFilterOptions
};
