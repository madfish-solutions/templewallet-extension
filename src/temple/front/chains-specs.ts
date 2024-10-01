import { useCallback, useMemo } from 'react';

import { EVM_CHAINS_SPECS_STORAGE_KEY, TEZOS_CHAINS_SPECS_STORAGE_KEY } from 'lib/constants';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import { useStorage } from 'lib/temple/front/storage';
import { TempleTezosChainId } from 'lib/temple/types';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

interface ChainSpecsBase {
  activeRpcId?: string;
  activeBlockExplorerId?: string;
  disabled?: boolean;
  name?: string;
  testnet?: boolean;
}

export interface TezosChainSpecs extends ChainSpecsBase {}

export interface EvmChainSpecs extends ChainSpecsBase {
  currency?: EvmNativeTokenMetadata;
}

const DEFAULT_TEZOS_CHAINS_SPECS: Record<string, TezosChainSpecs> = {
  [TempleTezosChainId.Mainnet]: {
    name: 'Tezos Mainnet',
    testnet: false
  },
  [TempleTezosChainId.Dcp]: {
    name: 'T4L3NT Mainnet',
    testnet: false
  },
  [TempleTezosChainId.DcpTest]: {
    name: 'T4L3NT Testnet'
  },
  [TempleTezosChainId.Ghostnet]: {
    name: 'Ghostnet Testnet'
  }
};

const DEFAULT_EVM_CHAINS_SPECS: Record<string, EvmChainSpecs> = {
  '1': {
    name: 'Ethereum Mainnet',
    testnet: false,
    currency: DEFAULT_EVM_CURRENCY
  },
  '137': {
    name: 'Polygon Mainnet',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'POL', // https://learn.bybit.com/blockchain/polygon-2-0-from-matic-to-pol
      symbol: 'POL'
    }
  },
  '56': {
    name: 'BSC Mainnet',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'BNB',
      symbol: 'BNB'
    }
  },
  '43114': {
    name: 'Avalanche Mainnet',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Avalanche',
      symbol: 'AVAX'
    }
  },
  '10': {
    name: 'Optimism Mainnet',
    testnet: false,
    currency: DEFAULT_EVM_CURRENCY
  },
  '11155111': {
    name: 'Ethereum Sepolia',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Sepolia Ether'
    }
  },
  '80002': {
    name: 'Polygon Amoy',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'POL',
      symbol: 'POL'
    }
  },
  '97': {
    name: 'BSC Testnet',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'BNB',
      symbol: 'tBNB'
    }
  },
  '43113': {
    name: 'Avalanche Fuji',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Avalanche Fuji',
      symbol: 'AVAX'
    }
  },
  '11155420': {
    name: 'Optimism Sepolia',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Sepolia Ether'
    }
  }
};

const useSpecs = <T extends TezosChainSpecs | EvmChainSpecs>(storageKey: string, defaultSpecs: OptionalRecord<T>) => {
  const [storedSpecs, setStoredSpecs] = useStorage<OptionalRecord<T>>(storageKey, EMPTY_FROZEN_OBJ);

  const totalSpecs = useMemo(() => ({ ...defaultSpecs, ...storedSpecs }), [defaultSpecs, storedSpecs]);
  const setSpecs = useCallback(
    (newSpecs: OptionalRecord<T> | ((prevSpecs: OptionalRecord<T>) => OptionalRecord<T>)) => {
      setStoredSpecs(prevSpecs => {
        const prevSpecsWithDefault = { ...defaultSpecs, ...prevSpecs };

        return typeof newSpecs === 'function' ? newSpecs(prevSpecsWithDefault) : newSpecs;
      });
    },
    [defaultSpecs, setStoredSpecs]
  );

  return [totalSpecs, setSpecs] as const;
};
export const useTezosChainsSpecs = () =>
  useSpecs<TezosChainSpecs>(TEZOS_CHAINS_SPECS_STORAGE_KEY, DEFAULT_TEZOS_CHAINS_SPECS);
export const useEvmChainsSpecs = () => useSpecs<EvmChainSpecs>(EVM_CHAINS_SPECS_STORAGE_KEY, DEFAULT_EVM_CHAINS_SPECS);

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
  const removeChainSpecs = useCallback(() => {
    switch (chainKind) {
      case TempleChainKind.EVM:
        return setEvmChainsSpecs(({ [chainId]: specsToRemove, ...rest }) => rest);
      case TempleChainKind.Tezos:
        return setTezosChainsSpecs(({ [chainId]: specsToRemove, ...rest }) => rest);
    }
  }, [chainId, chainKind, setEvmChainsSpecs, setTezosChainsSpecs]);

  return [chainSpecs, setChainSpecs, removeChainSpecs] as const;
};
