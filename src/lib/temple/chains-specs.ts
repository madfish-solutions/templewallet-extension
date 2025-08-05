import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';

import {
  ETH_SEPOLIA_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  COMMON_MAINNET_CHAIN_IDS,
  TempleTezosChainId,
  COMMON_TESTNET_CHAIN_IDS
} from './types';

interface ChainSpecsBase {
  activeRpcId?: string;
  activeBlockExplorerId?: string;
  disabled?: boolean;
  disabledAutomatically?: boolean;
  name?: string;
  testnet?: boolean;
}

export interface TezosChainSpecs extends ChainSpecsBase {
  currencySymbol?: string;
}

export interface EvmChainSpecs extends ChainSpecsBase {
  currency?: EvmNativeTokenMetadata;
}

export const DEFAULT_TEZOS_CHAINS_SPECS: Record<string, TezosChainSpecs & { testnet: boolean }> = {
  [TempleTezosChainId.Mainnet]: {
    name: 'Tezos',
    testnet: false
  },
  [TempleTezosChainId.Dcp]: {
    name: 'T4L3NT',
    testnet: false
  },
  [TempleTezosChainId.DcpTest]: {
    name: 'T4L3NT',
    testnet: true
  },
  [TempleTezosChainId.Ghostnet]: {
    name: 'Ghostnet',
    testnet: true
  }
};

export const DEFAULT_EVM_CHAINS_SPECS: Record<string, EvmChainSpecs & { testnet: boolean }> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: {
    name: 'Ethereum',
    testnet: false,
    currency: DEFAULT_EVM_CURRENCY
  },
  [COMMON_MAINNET_CHAIN_IDS.polygon]: {
    name: 'Polygon',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'POL', // https://learn.bybit.com/blockchain/polygon-2-0-from-matic-to-pol
      symbol: 'POL'
    }
  },
  [COMMON_MAINNET_CHAIN_IDS.bsc]: {
    name: 'BSC',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'BNB',
      symbol: 'BNB'
    }
  },
  [COMMON_MAINNET_CHAIN_IDS.avalanche]: {
    name: 'Avalanche',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Avalanche',
      symbol: 'AVAX'
    }
  },
  [COMMON_MAINNET_CHAIN_IDS.optimism]: {
    name: 'Optimism',
    testnet: false,
    currency: DEFAULT_EVM_CURRENCY
  },
  [COMMON_MAINNET_CHAIN_IDS.base]: {
    name: 'Base',
    testnet: false,
    currency: DEFAULT_EVM_CURRENCY
  },
  [COMMON_MAINNET_CHAIN_IDS.etherlink]: {
    name: 'Etherlink',
    testnet: false,
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Tezos',
      symbol: 'XTZ'
    }
  },
  [ETH_SEPOLIA_CHAIN_ID]: {
    name: 'Ethereum Sepolia',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Sepolia Ethereum'
    },
    testnet: true
  },
  [COMMON_TESTNET_CHAIN_IDS.polygon]: {
    name: 'Polygon Amoy',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'POL',
      symbol: 'POL'
    },
    testnet: true
  },
  [COMMON_TESTNET_CHAIN_IDS.bsc]: {
    name: 'BSC',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'BNB',
      symbol: 'tBNB'
    },
    testnet: true
  },
  [COMMON_TESTNET_CHAIN_IDS.avalanche]: {
    name: 'Avalanche Fuji',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Avalanche Fuji',
      symbol: 'AVAX'
    },
    testnet: true
  },
  [COMMON_TESTNET_CHAIN_IDS.optimism]: {
    name: 'Optimism Sepolia',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Sepolia Ethereum'
    },
    testnet: true
  },
  [COMMON_TESTNET_CHAIN_IDS.base]: {
    name: 'Base Sepolia',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Sepolia Ether'
    },
    testnet: true
  },
  [COMMON_TESTNET_CHAIN_IDS.etherlink]: {
    name: 'Etherlink',
    currency: {
      ...DEFAULT_EVM_CURRENCY,
      name: 'Ghostnet Tezos',
      symbol: 'XTZ'
    },
    testnet: true
  }
};
