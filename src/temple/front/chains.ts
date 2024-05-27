import type { TID } from 'lib/i18n';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import type { StoredTezosNetwork, StoredEvmNetwork } from 'temple/networks';
import type { TempleChainKind } from 'temple/types';

import { useAllTezosChains, useAllEvmChains } from './ready';

interface ChainBase {
  rpcBaseURL: string;
  name: string;
  nameI18nKey?: TID;
  disabled?: boolean;
}

export interface TezosChain extends ChainBase {
  kind: TempleChainKind.Tezos;
  chainId: string;
  rpc: StoredTezosNetwork;
  allRpcs: StoredTezosNetwork[];
}

export interface EvmChain extends ChainBase {
  kind: TempleChainKind.EVM;
  chainId: number;
  currency: EvmNativeTokenMetadata;
  testnet: boolean;
  rpc: StoredEvmNetwork;
  allRpcs: StoredEvmNetwork[];
}

export type OneOfChains = TezosChain | EvmChain;

export interface ChainSpecs {
  activeRpcId?: string;
  disabled?: boolean;
}

export const useTezosChainByChainId = (tezosChainId: string): TezosChain | null => {
  const allTezosChains = useAllTezosChains();

  return allTezosChains[tezosChainId] ?? null;
};

export const useTezosMainnetChain = () => useTezosChainByChainId(TEZOS_MAINNET_CHAIN_ID)!;

// ts-prune-ignore-next
export const useEvmChainByChainId = (evmChainId: number): EvmChain | undefined => {
  const allEvmChains = useAllEvmChains();

  return allEvmChains[evmChainId];
};

export const useEthereumMainnetChain = () => useEvmChainByChainId(1)!;

const useEvmMainnetChains = () => {
  const allNetworks = useAllEvmChains();

  return useMemoWithCompare(() => Object.values(allNetworks).filter(({ testnet }) => !testnet), [allNetworks]);
};

export const useEvmMainnetChainIds = () => {
  const mainnetNetworks = useEvmMainnetChains();

  return mainnetNetworks.map(({ chainId }) => chainId);
};
