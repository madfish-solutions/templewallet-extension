import { useEffect, useMemo } from 'react';

import { CURRENT_TEZOS_NETWORK_ID_STORAGE_KEY, CURRENT_EVM_NETWORK_ID_STORAGE_KEY } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { TempleTezosChainId } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  EVM_DEFAULT_NETWORKS,
  StoredEvmNetwork,
  StoredTezosNetwork,
  TEZOS_DEFAULT_NETWORKS,
  isTezosDcpChainId
} from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import type { TezosChain, EvmChain } from '../chains';

export function useReadyTempleTezosNetworks(customTezosNetworks: StoredTezosNetwork[]) {
  const allTezosNetworks = useMemo<typeof TEZOS_DEFAULT_NETWORKS>(
    () => [...TEZOS_DEFAULT_NETWORKS, ...customTezosNetworks],
    [customTezosNetworks]
  );

  const defTezosNetwork = allTezosNetworks[0];

  const [tezosNetworkId, setTezosNetworkId] = usePassiveStorage(
    CURRENT_TEZOS_NETWORK_ID_STORAGE_KEY,
    defTezosNetwork.id
  );

  const tezosNetwork = useMemoWithCompare(() => {
    const tezosNetwork = allTezosNetworks.find(n => n.id === tezosNetworkId) ?? defTezosNetwork;
    const chainId = tezosNetwork.chainId;

    return {
      ...tezosNetwork,
      isMainnet: chainId === TempleTezosChainId.Mainnet,
      isDcp: isTezosDcpChainId(chainId)
    };
  }, [allTezosNetworks, tezosNetworkId, defTezosNetwork]);

  const allTezosChains = useMemo(() => {
    const rpcByChainId = new Map<string, NonEmptyArray<StoredTezosNetwork>>();

    for (const rpc of allTezosNetworks) {
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

      chains[chainId] = {
        kind: TempleChainKind.Tezos,
        chainId,
        rpcBaseURL,
        name,
        nameI18nKey,
        rpc: activeRpc,
        disabled: false // TODO: Implement!
      };
    }

    return chains;
  }, [allTezosNetworks]);

  useEffect(() => {
    if (allTezosNetworks.every(a => a.id !== tezosNetworkId)) {
      setTezosNetworkId(defTezosNetwork.id);
    }
  }, [allTezosNetworks, tezosNetworkId, defTezosNetwork, setTezosNetworkId]);

  return {
    allTezosNetworks,
    allTezosChains,
    //
    //
    tezosNetwork,
    setTezosNetworkId
  };
}

export function useReadyTempleEvmNetworks(customEvmNetworks: StoredEvmNetwork[]) {
  const allEvmNetworks = useMemo<typeof EVM_DEFAULT_NETWORKS>(
    () => [...EVM_DEFAULT_NETWORKS, ...customEvmNetworks],
    [customEvmNetworks]
  );

  const defEvmNetwork = allEvmNetworks[0];

  const [evmNetworkId, setEvmNetworkId] = usePassiveStorage(CURRENT_EVM_NETWORK_ID_STORAGE_KEY, defEvmNetwork.id);

  const evmNetwork = useMemoWithCompare(
    () => allEvmNetworks.find(n => n.id === evmNetworkId) ?? defEvmNetwork,
    [allEvmNetworks, evmNetworkId, defEvmNetwork]
  );

  const allEvmChains = useMemo(() => {
    const rpcByChainId = new Map<number, NonEmptyArray<StoredEvmNetwork>>();

    for (const rpc of allEvmNetworks) {
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

      chains[chainId] = {
        kind: TempleChainKind.EVM,
        chainId,
        rpcBaseURL,
        name,
        nameI18nKey,
        rpc: activeRpc,
        disabled: false // TODO: Implement!
      };
    }

    return chains;
  }, [allEvmNetworks]);

  useEffect(() => {
    if (allEvmNetworks.every(a => a.id !== evmNetworkId)) {
      setEvmNetworkId(defEvmNetwork.id);
    }
  }, [allEvmNetworks, evmNetworkId, defEvmNetwork, setEvmNetworkId]);

  return {
    allEvmNetworks,
    allEvmChains,
    //
    //
    evmNetwork,
    setEvmNetworkId
  };
}
