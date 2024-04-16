import { ChainIds } from '@taquito/taquito';

import type { TID } from 'lib/i18n';
import { useAllTezosNetworks, useAllEvmNetworks } from 'lib/temple/front/ready';
import { StoredTezosNetwork, StoredEvmNetwork, TEZOS_DEFAULT_NETWORKS, EVM_DEFAULT_NETWORKS } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

/** TODO: || SoleChain || ChainForOneOf || OneOfChains */
export type SomeChain = TezosChain | EvmChain;

interface ChainBase {
  rpcBaseURL: string;
  name: string;
  nameI18nKey?: TID;
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

/** TODO: Memoization */
export const useAllTezosChains = () => {
  const allTezosRPCs = useAllTezosNetworks();

  const rpcByChainId = new Map<string, NonEmptyArray<StoredTezosNetwork>>();

  for (const rpc of allTezosRPCs) {
    const networks = rpcByChainId.get(rpc.chainId);
    if (networks) networks.push(rpc);
    else rpcByChainId.set(rpc.chainId, [rpc]);
  }

  const chains: StringRecord<TezosChain> = {};

  for (const [chainId, networks] of rpcByChainId) {
    const activeRpcId = 'NOT_IMPLEMENTED'; // TODO: Implement!
    const activeRpc = networks.find(n => n.id === activeRpcId) ?? networks[0];
    const { rpcBaseURL } = activeRpc;

    const defaultRpc = TEZOS_DEFAULT_NETWORKS.find(n => n.chainId === chainId);
    const { name, nameI18nKey } = defaultRpc ?? activeRpc;

    chains[chainId] = { kind: TempleChainKind.Tezos, chainId, rpcBaseURL, name, nameI18nKey, rpc: activeRpc };
  }

  return chains;
};

export const useTezosChainByChainId = (tezosChainId: string): TezosChain | null => {
  const allTezosChains = useAllTezosChains();

  return allTezosChains[tezosChainId] ?? null;
};

export const useTezosMainnetChain = () => useTezosChainByChainId(ChainIds.MAINNET)!;

/** TODO: Memoization */
export const useAllEvmChains = () => {
  const allEvmRPCs = useAllEvmNetworks();

  const rpcByChainId = new Map<number, NonEmptyArray<StoredEvmNetwork>>();

  for (const rpc of allEvmRPCs) {
    const networks = rpcByChainId.get(rpc.chainId);
    if (networks) networks.push(rpc);
    else rpcByChainId.set(rpc.chainId, [rpc]);
  }

  const chains: StringRecord<EvmChain> = {};

  for (const [chainId, networks] of rpcByChainId) {
    const activeRpcId = 'NOT_IMPLEMENTED'; // TODO: Implement!
    const activeRpc = networks.find(n => n.id === activeRpcId) ?? networks[0];
    const { rpcBaseURL } = activeRpc;

    const defaultRpc = EVM_DEFAULT_NETWORKS.find(n => n.chainId === chainId);
    const { name, nameI18nKey } = defaultRpc ?? activeRpc;

    chains[chainId] = { kind: TempleChainKind.EVM, chainId, rpcBaseURL, name, nameI18nKey, rpc: activeRpc };
  }

  return chains;
};
