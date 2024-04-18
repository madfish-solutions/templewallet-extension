import type { TID } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import type { StoredTezosNetwork, StoredEvmNetwork, EvmNativeCurrency } from 'temple/networks';
import type { TempleChainKind } from 'temple/types';

import { useAllTezosChains, useAllEvmChains } from './ready';

/** TODO: || SoleChain || ChainForOneOf || OneOfChains */
export type SomeChain = TezosChain | EvmChain;

interface ChainBase {
  rpcBaseURL: string;
  name: string;
  nameI18nKey?: TID;
  disabled?: boolean;
}

/** TODO: || ChainOfTezos || ChainForTezos */
export interface TezosChain extends ChainBase {
  kind: TempleChainKind.Tezos;
  chainId: string;
  rpc: StoredTezosNetwork;
  allRpcs: StoredTezosNetwork[];
}

export interface EvmChain extends ChainBase {
  kind: TempleChainKind.EVM;
  chainId: number;
  currency: EvmNativeCurrency;
  rpc: StoredEvmNetwork;
  allRpcs: StoredEvmNetwork[];
}

export interface TezosChainSpecs {
  activeRpcId: string;
  disabled?: boolean;
}

export interface EvmChainSpecs {
  activeRpcId: string;
  disabled?: boolean;
  currency?: EvmNativeCurrency;
}

export const useTezosChainByChainId = (tezosChainId: string): TezosChain | null => {
  const allTezosChains = useAllTezosChains();

  return allTezosChains[tezosChainId] ?? null;
};

export const useTezosMainnetChain = () => useTezosChainByChainId(TEZOS_MAINNET_CHAIN_ID)!;

// ts-prune-ignore-next
export const useEvmChainByChainId = (evmChainId: number): EvmChain | null => {
  const allEvmChains = useAllEvmChains();

  return allEvmChains[evmChainId] ?? null;
};

export const useEvmMainnetChain = () => useEvmChainByChainId(1)!;
