import React, { FC, createContext, useCallback, useContext, useMemo } from 'react';

import * as ViemChains from 'viem/chains';

import { TempleTezosChainId } from 'lib/temple/types';
import { useAllEvmChains } from 'temple/front';
import { EVM_DEFAULT_NETWORKS, TEZOS_DEFAULT_NETWORKS } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

interface Value {
  isDefaultNetwork: (chainKind: TempleChainKind, chainId: string | number) => boolean;
  isMainnet: (chainKind: TempleChainKind, chainId: string | number) => boolean;
}

const AdditionalChainsPropsContext = createContext<Value>({
  isDefaultNetwork: () => true,
  isMainnet: () => true
});

export const useAdditionalChainsPropsContext = () => useContext(AdditionalChainsPropsContext);

export const AdditionalChainsPropsContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const evmChainsRecord = useAllEvmChains();

  const defaultNetworksChainIds = useMemo(() => {
    const result = {
      [TempleChainKind.EVM]: new Set<number>(),
      [TempleChainKind.Tezos]: new Set<string>()
    };
    EVM_DEFAULT_NETWORKS.forEach(({ chainId }) => result[TempleChainKind.EVM].add(chainId));
    TEZOS_DEFAULT_NETWORKS.forEach(({ chainId }) => result[TempleChainKind.Tezos].add(chainId));

    return result;
  }, []);
  const isDefaultNetwork = useCallback(
    (chainKind: TempleChainKind, chainId: string | number) =>
      chainKind === TempleChainKind.Tezos
        ? defaultNetworksChainIds[chainKind].has(String(chainId))
        : defaultNetworksChainIds[chainKind].has(Number(chainId)),
    [defaultNetworksChainIds]
  );

  const mainnetsChainIds = useMemo(() => {
    const evmChainIds = new Set<number>();
    const viemChains = Object.values(ViemChains);
    Object.keys(evmChainsRecord).forEach(chainId => {
      const viemChain = viemChains.find(chain => chain.id === Number(chainId));

      if (viemChain && viemChain.testnet !== true) {
        evmChainIds.add(Number(chainId));
      }
    });

    return {
      [TempleChainKind.EVM]: evmChainIds,
      [TempleChainKind.Tezos]: new Set<string>([TempleTezosChainId.Mainnet, TempleTezosChainId.Dcp])
    };
  }, [evmChainsRecord]);
  const isMainnet = useCallback(
    (chainKind: TempleChainKind, chainId: string | number) =>
      chainKind === TempleChainKind.Tezos
        ? mainnetsChainIds[chainKind].has(String(chainId))
        : mainnetsChainIds[chainKind].has(Number(chainId)),
    [mainnetsChainIds]
  );

  return (
    <AdditionalChainsPropsContext.Provider value={{ isDefaultNetwork, isMainnet }}>
      {children}
    </AdditionalChainsPropsContext.Provider>
  );
};
