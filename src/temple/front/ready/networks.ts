import { useMemo } from 'react';

import { EVM_CHAINS_SPECS_STORAGE_KEY, TEZOS_CHAINS_SPECS_STORAGE_KEY } from 'lib/constants';
import { useStorage } from 'lib/temple/front/storage';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import {
  DEFAULT_EVM_CURRENCY,
  EVM_DEFAULT_NETWORKS,
  StoredEvmNetwork,
  StoredTezosNetwork,
  TEZOS_DEFAULT_NETWORKS
} from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import type { TezosChain, EvmChain, TezosChainSpecs, EvmChainSpecs } from '../chains';

export function useReadyTempleTezosNetworks(customTezosNetworks: StoredTezosNetwork[]) {
  const allTezosNetworks = useMemo<typeof TEZOS_DEFAULT_NETWORKS>(
    () => [...TEZOS_DEFAULT_NETWORKS, ...customTezosNetworks],
    [customTezosNetworks]
  );

  const [tezosChainsSpecs] = useStorage<OptionalRecord<TezosChainSpecs>>(
    TEZOS_CHAINS_SPECS_STORAGE_KEY,
    EMPTY_FROZEN_OBJ
  );

  const allTezosChains = useMemo(() => {
    const rpcByChainId = new Map<string, NonEmptyArray<StoredTezosNetwork>>();

    for (const rpc of allTezosNetworks) {
      const networks = rpcByChainId.get(rpc.chainId);
      if (networks) networks.push(rpc);
      else rpcByChainId.set(rpc.chainId, [rpc]);
    }

    const chains: StringRecord<TezosChain> = {};

    for (const [chainId, networks] of rpcByChainId) {
      const specs = tezosChainsSpecs[chainId];
      const activeRpcId = specs?.activeRpcId;
      const activeRpc = (activeRpcId && networks.find(n => n.id === activeRpcId)) || networks[0];
      const { rpcBaseURL } = activeRpc;

      const defaultRpc = TEZOS_DEFAULT_NETWORKS.find(n => n.chainId === chainId);
      const { name, nameI18nKey } = defaultRpc ?? activeRpc;

      chains[chainId] = {
        kind: TempleChainKind.Tezos,
        chainId,
        rpcBaseURL,
        name,
        nameI18nKey,
        rpc: activeRpc,
        allRpcs: networks,
        disabled: chainId === TEZOS_MAINNET_CHAIN_ID ? false : specs?.disabled
      };
    }

    return chains;
  }, [allTezosNetworks, tezosChainsSpecs]);

  const enabledTezosChains = useMemo(
    () => Object.values(allTezosChains).filter(chain => !chain.disabled),
    [allTezosChains]
  );

  return {
    allTezosChains,
    enabledTezosChains
  };
}

export function useReadyTempleEvmNetworks(customEvmNetworks: StoredEvmNetwork[]) {
  const allEvmNetworks = useMemo<typeof EVM_DEFAULT_NETWORKS>(
    () => [...EVM_DEFAULT_NETWORKS, ...customEvmNetworks],
    [customEvmNetworks]
  );

  const [evmChainsSpecs] = useStorage<OptionalRecord<EvmChainSpecs>>(EVM_CHAINS_SPECS_STORAGE_KEY, EMPTY_FROZEN_OBJ);

  const allEvmChains = useMemo(() => {
    const rpcByChainId = new Map<number, NonEmptyArray<StoredEvmNetwork>>();

    for (const rpc of allEvmNetworks) {
      const networks = rpcByChainId.get(rpc.chainId);
      if (networks) networks.push(rpc);
      else rpcByChainId.set(rpc.chainId, [rpc]);
    }

    const chains: StringRecord<EvmChain> = {};

    for (const [chainId, networks] of rpcByChainId) {
      const specs = evmChainsSpecs[chainId];
      const currency = specs?.currency ?? DEFAULT_EVM_CURRENCY;
      // TODO: if (!currency) continue; // Without default one, with defaults by chain IDs

      const activeRpcId = specs?.activeRpcId;
      const activeRpc = networks.find(n => n.id === activeRpcId) ?? networks[0];
      const { rpcBaseURL } = activeRpc;

      const defaultRpc = EVM_DEFAULT_NETWORKS.find(n => n.chainId === chainId);
      const { name, nameI18nKey } = defaultRpc ?? activeRpc;

      chains[chainId] = {
        kind: TempleChainKind.EVM,
        chainId,
        rpcBaseURL,
        name,
        nameI18nKey,
        currency,
        rpc: activeRpc,
        allRpcs: networks,
        disabled: chainId === 1 ? false : specs?.disabled
      };
    }

    return chains;
  }, [allEvmNetworks, evmChainsSpecs]);

  const enabledEvmChains = useMemo(() => Object.values(allEvmChains).filter(chain => !chain.disabled), [allEvmChains]);

  return {
    allEvmChains,
    enabledEvmChains
  };
}
