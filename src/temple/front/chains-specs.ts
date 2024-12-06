import { useCallback, useMemo } from 'react';

import { EVM_CHAINS_SPECS_STORAGE_KEY, TEZOS_CHAINS_SPECS_STORAGE_KEY } from 'lib/constants';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import { useStorage } from 'lib/temple/front/storage';
import {
  OTHER_COMMON_MAINNET_CHAIN_IDS,
  ETHEREUM_MAINNET_CHAIN_ID,
  ETH_SEPOLIA_CHAIN_ID,
  TempleTezosChainId
} from 'lib/temple/types';
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

const DEFAULT_TEZOS_CHAINS_SPECS: Record<string, TezosChainSpecs & { testnet: boolean }> = {
  [TempleTezosChainId.Mainnet]: {
    name: 'Tezos Mainnet',
    testnet: false
  },
  [TempleTezosChainId.Dcp]: {
    name: 'T4L3NT Mainnet',
    testnet: false
  },
  [TempleTezosChainId.DcpTest]: {
    name: 'T4L3NT Testnet',
    testnet: true
  },
  [TempleTezosChainId.Ghostnet]: {
    name: 'Ghostnet Testnet',
    testnet: true
  }
};

const DEFAULT_EVM_CHAINS_SPECS: Record<string, EvmChainSpecs & { testnet: boolean }> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: {
    name: 'Ethereum Mainnet',
    testnet: false,
    currency: DEFAULT_EVM_CURRENCY
  },
  [OTHER_COMMON_MAINNET_CHAIN_IDS.polygon]: {
    name: 'Polygon Mainnet',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'POL', // https://learn.bybit.com/blockchain/polygon-2-0-from-matic-to-pol
      symbol: 'POL'
    }
  },
  [OTHER_COMMON_MAINNET_CHAIN_IDS.bsc]: {
    name: 'BSC Mainnet',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'BNB',
      symbol: 'BNB'
    }
  },
  [OTHER_COMMON_MAINNET_CHAIN_IDS.avalanche]: {
    name: 'Avalanche Mainnet',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Avalanche',
      symbol: 'AVAX'
    }
  },
  [OTHER_COMMON_MAINNET_CHAIN_IDS.optimism]: {
    name: 'Optimism Mainnet',
    testnet: false,
    currency: DEFAULT_EVM_CURRENCY
  },
  [ETH_SEPOLIA_CHAIN_ID]: {
    name: 'Ethereum Sepolia',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Sepolia Ether'
    },
    testnet: true
  },
  '80002': {
    name: 'Polygon Amoy',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'POL',
      symbol: 'POL'
    },
    testnet: true
  },
  '97': {
    name: 'BSC Testnet',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'BNB',
      symbol: 'tBNB'
    },
    testnet: true
  },
  '43113': {
    name: 'Avalanche Fuji',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Avalanche Fuji',
      symbol: 'AVAX'
    },
    testnet: true
  },
  '11155420': {
    name: 'Optimism Sepolia',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Sepolia Ether'
    },
    testnet: true
  }
};

const useSpecs = <T extends TezosChainSpecs | EvmChainSpecs>(storageKey: string, defaultSpecs: OptionalRecord<T>) => {
  const [storedSpecs, setStoredSpecs] = useStorage<OptionalRecord<T>>(storageKey, EMPTY_FROZEN_OBJ);

  const totalSpecs = useMemo(() => ({ ...defaultSpecs, ...storedSpecs }), [defaultSpecs, storedSpecs]);
  const setSpecs = useCallback(
    (newSpecs: OptionalRecord<T> | ((prevSpecs: OptionalRecord<T>) => OptionalRecord<T>)) =>
      setStoredSpecs(prevSpecs => {
        const prevSpecsWithDefault = { ...defaultSpecs, ...prevSpecs };

        return typeof newSpecs === 'function' ? newSpecs(prevSpecsWithDefault) : newSpecs;
      }),
    [defaultSpecs, setStoredSpecs]
  );

  return [totalSpecs, setSpecs] as const;
};

export const useTezosChainsSpecs = () =>
  useSpecs<TezosChainSpecs>(TEZOS_CHAINS_SPECS_STORAGE_KEY, DEFAULT_TEZOS_CHAINS_SPECS);

export const useEvmChainsSpecs = () => useSpecs<EvmChainSpecs>(EVM_CHAINS_SPECS_STORAGE_KEY, DEFAULT_EVM_CHAINS_SPECS);

export const useChainSpecs = (chainKind: TempleChainKind, chainId: string | number) => {
  const [, setTezosChainsSpecs] = useTezosChainsSpecs();
  const [, setEvmChainsSpecs] = useEvmChainsSpecs();

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

  return [setChainSpecs, removeChainSpecs] as const;
};
