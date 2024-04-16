import type { TID } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import type { StoredTezosNetwork, StoredEvmNetwork } from 'temple/networks';
import type { TempleChainKind } from 'temple/types';

import { useAllTezosChains } from './ready';

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
}

export interface EvmChain extends ChainBase {
  kind: TempleChainKind.EVM;
  chainId: number;
  rpc: StoredEvmNetwork;
}

export const useTezosChainByChainId = (tezosChainId: string): TezosChain | null => {
  const allTezosChains = useAllTezosChains();

  return allTezosChains[tezosChainId] ?? null;
};

export const useTezosMainnetChain = () => useTezosChainByChainId(TEZOS_MAINNET_CHAIN_ID)!;
