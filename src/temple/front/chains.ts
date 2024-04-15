import { ChainIds } from '@taquito/taquito';

import { useAllTezosNetworks, useAllEvmNetworks } from 'lib/temple/front/ready';
import { StoredTezosNetwork, StoredEvmNetwork, TEZOS_DEFAULT_NETWORKS, DEFAULT_EVM_NETWORKS } from 'temple/networks';

/** TODO: || SoleChain || ChainForOneOf || OneOfChains */
export type SomeChain = TezosChain | EvmChain;

/** TODO: || ChainOfTezos || ChainForTezos */
export interface TezosChain extends StoredTezosNetwork {}
export interface EvmChain extends StoredEvmNetwork {}

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
    const id = `tezos-${activeRpc.id}`; // TODO: Remove `id`
    const testnet = networks.some(n => n.testnet); // TODO: Implement solid!

    const defaultRpc = TEZOS_DEFAULT_NETWORKS.find(n => n.chainId === chainId);
    const { name, nameI18nKey } = defaultRpc ?? activeRpc;

    chains[chainId] = { ...activeRpc, id, testnet, name, nameI18nKey };
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
    const id = `evm-${activeRpc.id}`; // TODO: Remove `id`
    const testnet = networks.some(n => n.testnet); // TODO: Implement solid!

    const defaultRpc = DEFAULT_EVM_NETWORKS.find(n => n.chainId === chainId);
    const { name, nameI18nKey } = defaultRpc ?? activeRpc;

    chains[chainId] = { ...activeRpc, id, testnet, name, nameI18nKey };
  }

  return chains;
};
