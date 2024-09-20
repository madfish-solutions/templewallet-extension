import { useCallback } from 'react';

import { EVM_CHAINS_SPECS_STORAGE_KEY, TEZOS_CHAINS_SPECS_STORAGE_KEY } from 'lib/constants';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import { useStorage } from 'lib/temple/front/storage';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import { TempleChainKind } from 'temple/types';

export interface TezosChainSpecs {
  activeRpcId?: string;
  activeBlockExplorerId?: string;
  disabled?: boolean;
}

export interface EvmChainSpecs {
  activeRpcId?: string;
  activeBlockExplorerId?: string;
  disabled?: boolean;
  currency?: EvmNativeTokenMetadata;
}

export const useTezosChainsSpecs = () =>
  useStorage<OptionalRecord<TezosChainSpecs>>(TEZOS_CHAINS_SPECS_STORAGE_KEY, EMPTY_FROZEN_OBJ);
export const useEvmChainsSpecs = () =>
  useStorage<OptionalRecord<EvmChainSpecs>>(EVM_CHAINS_SPECS_STORAGE_KEY, EMPTY_FROZEN_OBJ);

export const useChainSpecs = (chainKind: TempleChainKind, chainId: string | number) => {
  const [tezosChainsSpecs, setTezosChainsSpecs] = useTezosChainsSpecs();
  const [evmChainsSpecs, setEvmChainsSpecs] = useEvmChainsSpecs();

  const chainSpecs: TezosChainSpecs | EvmChainSpecs =
    (chainKind === TempleChainKind.Tezos ? tezosChainsSpecs[chainId] : evmChainsSpecs[chainId]) ?? {};
  const setChainSpecs = useCallback(
    (
      newChainSpecs:
        | TezosChainSpecs
        | EvmChainSpecs
        | ((prevSpecs: TezosChainSpecs) => TezosChainSpecs)
        | ((prevSpecs: EvmChainSpecs) => EvmChainSpecs)
    ) => {
      switch (chainKind) {
        case TempleChainKind.EVM:
          return setEvmChainsSpecs(prevValue => ({
            ...prevValue,
            [chainId]: typeof newChainSpecs === 'function' ? newChainSpecs(prevValue[chainId] ?? {}) : newChainSpecs
          }));
        case TempleChainKind.Tezos:
          return setTezosChainsSpecs(prevValue => ({
            ...prevValue,
            [chainId]: typeof newChainSpecs === 'function' ? newChainSpecs(prevValue[chainId] ?? {}) : newChainSpecs
          }));
      }
    },
    [chainId, chainKind, setEvmChainsSpecs, setTezosChainsSpecs]
  );

  return [chainSpecs, setChainSpecs] as const;
};
