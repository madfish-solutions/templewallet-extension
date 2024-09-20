import { useCallback, useMemo } from 'react';

import * as ViemChains from 'viem/chains';

import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import {
  DEFAULT_EVM_CURRENCY,
  EVM_DEFAULT_NETWORKS,
  StoredEvmNetwork,
  StoredTezosNetwork,
  TEZOS_DEFAULT_NETWORKS
} from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { useBlockExplorers } from '../block-explorers';
import type { EvmChain, TezosChain } from '../chains';
import { EvmChainSpecs, TezosChainSpecs, useEvmChainsSpecs, useTezosChainsSpecs } from '../chains-specs';

type Specs<T extends TezosChain | EvmChain> = T extends TezosChain ? TezosChainSpecs : EvmChainSpecs;
type StoredNetwork<T extends TezosChain | EvmChain> = T extends TezosChain ? StoredTezosNetwork : StoredEvmNetwork;
type ChainBaseProps<T extends TezosChain | EvmChain> = Pick<
  T,
  | 'chainId'
  | 'rpcBaseURL'
  | 'name'
  | 'nameI18nKey'
  | 'rpc'
  | 'allRpcs'
  | 'allBlockExplorers'
  | 'activeBlockExplorer'
  | 'disabled'
>;

function useChains<T extends TezosChain | EvmChain>(
  makeChain: (baseProps: ChainBaseProps<T>, specs?: Specs<T>) => T,
  chainsSpecs: OptionalRecord<Specs<T>>,
  networks: NonEmptyArray<StoredNetwork<T>>,
  defaultNetworks: NonEmptyArray<StoredNetwork<T>>,
  chainKind: T extends TezosChain ? TempleChainKind.Tezos : TempleChainKind.EVM
) {
  const { allBlockExplorers } = useBlockExplorers();

  const allChains = useMemo(() => {
    const rpcByChainId = new Map<T['chainId'], NonEmptyArray<StoredNetwork<T>>>();

    for (const rpc of networks) {
      const networks = rpcByChainId.get(rpc.chainId);
      if (networks) networks.push(rpc);
      else rpcByChainId.set(rpc.chainId, [rpc]);
    }

    const chains: StringRecord<T> = {};

    for (const [chainId, networks] of rpcByChainId) {
      const specs = chainsSpecs[String(chainId)];
      const activeRpcId = specs?.activeRpcId;
      const activeRpc = (activeRpcId && networks.find(n => n.id === activeRpcId)) || networks[0];
      const { rpcBaseURL } = activeRpc;

      const defaultRpc = defaultNetworks.find(n => n.chainId === chainId);
      const { name, nameI18nKey } = defaultRpc ?? activeRpc;
      const chainBlockExplorers = allBlockExplorers[chainKind]?.[chainId] ?? [];

      const baseProps = {
        chainId,
        rpcBaseURL,
        name,
        nameI18nKey,
        rpc: activeRpc,
        disabled: specs?.disabled,
        allRpcs: networks as T['allRpcs'],
        allBlockExplorers: chainBlockExplorers,
        activeBlockExplorer:
          chainBlockExplorers.find(({ id }) => id === specs?.activeBlockExplorerId) ?? chainBlockExplorers[0]
      };

      chains[String(chainId)] = makeChain(baseProps, specs);
    }

    return chains;
  }, [allBlockExplorers, chainKind, chainsSpecs, defaultNetworks, makeChain, networks]);

  const enabledChains = useMemo(() => Object.values(allChains).filter(chain => !chain.disabled), [allChains]);

  return { allChains, enabledChains };
}

export function useReadyTempleTezosNetworks(customTezosNetworks: StoredTezosNetwork[]) {
  const allTezosNetworks = useMemo<typeof TEZOS_DEFAULT_NETWORKS>(
    () => [...TEZOS_DEFAULT_NETWORKS, ...customTezosNetworks],
    [customTezosNetworks]
  );

  const [tezosChainsSpecs] = useTezosChainsSpecs();

  const makeChain = useCallback(
    (baseProps: ChainBaseProps<TezosChain>) => ({
      ...baseProps,
      kind: TempleChainKind.Tezos as const
    }),
    []
  );
  const { allChains, enabledChains } = useChains<TezosChain>(
    makeChain,
    tezosChainsSpecs,
    allTezosNetworks,
    TEZOS_DEFAULT_NETWORKS,
    TempleChainKind.Tezos
  );

  return {
    allTezosChains: allChains,
    enabledTezosChains: enabledChains
  };
}

export function useReadyTempleEvmNetworks(customEvmNetworks: StoredEvmNetwork[]) {
  const allEvmNetworks = useMemo<typeof EVM_DEFAULT_NETWORKS>(
    () => [...EVM_DEFAULT_NETWORKS, ...customEvmNetworks],
    [customEvmNetworks]
  );

  const [evmChainsSpecs] = useEvmChainsSpecs();

  const makeChain = useCallback(
    (baseProps: ChainBaseProps<EvmChain>, specs?: EvmChainSpecs) => ({
      ...baseProps,
      kind: TempleChainKind.EVM as const,
      currency: getCurrency(baseProps.chainId, specs?.currency)
    }),
    []
  );
  const { allChains, enabledChains } = useChains<EvmChain>(
    makeChain,
    evmChainsSpecs,
    allEvmNetworks,
    EVM_DEFAULT_NETWORKS,
    TempleChainKind.EVM
  );

  return {
    allEvmChains: allChains,
    enabledEvmChains: enabledChains
  };
}

const getCurrency = (chainId: number, specsCurrency?: EvmNativeTokenMetadata): EvmNativeTokenMetadata => {
  if (specsCurrency) return specsCurrency;

  const viemChain = Object.values(ViemChains).find(chain => chain.id === chainId);

  if (viemChain) {
    return {
      standard: EvmAssetStandard.NATIVE,
      address: EVM_TOKEN_SLUG,
      ...viemChain.nativeCurrency
    };
  }

  return DEFAULT_EVM_CURRENCY;
};
