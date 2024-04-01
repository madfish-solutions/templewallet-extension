import type { TID } from 'lib/i18n';
import { TempleTezosChainId } from 'lib/temple/types';

export interface NetworkBase {
  id: string;
  rpcBaseURL: string;
  name: string;
  nameI18nKey?: TID;
  description?: string;
  color: string;
  testnet?: boolean;
  // Deprecated params:
  /** @deprecated */
  type?: 'main' | 'test' | 'dcp';
  /** @deprecated // (i) No persisted item had it set to `true` */
  disabled?: boolean;
}

export interface StoredTezosNetwork extends NetworkBase {
  chainId: string;
}

const TEZOS_NON_TESTNET_CHAIN_IDS: string[] = [TempleTezosChainId.Mainnet, TempleTezosChainId.Dcp];

export const isTezosTestnetChainId = (chainId: string) => !TEZOS_NON_TESTNET_CHAIN_IDS.includes(chainId);

const TEZOS_DCP_NETWORKS: StoredTezosNetwork[] = [
  {
    id: 't4l3nt-mainnet',
    name: 'T4L3NT Mainnet',
    description: 'Decentralized pictures Betanet',
    rpcBaseURL: 'https://rpc.decentralized.pictures',
    chainId: TempleTezosChainId.Dcp,
    color: '#047857'
  },
  {
    id: 't4l3nt-testnet',
    name: 'T4L3NT Testnet',
    description: 'Decentralized pictures testnet',
    rpcBaseURL: 'https://staging-rpc.decentralized.pictures/',
    chainId: TempleTezosChainId.DcpTest,
    testnet: true,
    color: '#131380'
  }
];

export const TEZOS_DEFAULT_NETWORKS: NonEmptyArray<StoredTezosNetwork> = [
  {
    id: 'mainnet',
    name: 'Tezos Mainnet',
    nameI18nKey: 'tezosMainnet',
    description: 'Tezos mainnet',
    rpcBaseURL: 'https://prod.tcinfra.net/rpc/mainnet',
    chainId: TempleTezosChainId.Mainnet,
    color: '#83b300'
  },
  {
    id: 'marigold-mainnet',
    name: 'Marigold Mainnet',
    nameI18nKey: 'marigoldMainnet',
    description: 'Marigold mainnet',
    rpcBaseURL: 'https://mainnet.tezos.marigold.dev',
    chainId: TempleTezosChainId.Mainnet,
    color: '#48bb78'
  },
  {
    id: 'smartpy-mainnet',
    name: 'SmartPy Mainnet',
    description: 'SmartPy Mainnet',
    rpcBaseURL: 'https://mainnet.smartpy.io',
    chainId: TempleTezosChainId.Mainnet,
    color: '#34D399'
  },
  {
    id: 'tezie-mainnet',
    name: 'ECAD Labs Mainnet',
    description: 'Highly available Tezos Mainnet nodes operated by ECAD Labs',
    rpcBaseURL: 'https://mainnet.api.tez.ie',
    chainId: TempleTezosChainId.Mainnet,
    color: '#047857'
  },
  ...TEZOS_DCP_NETWORKS,
  {
    id: 'ghostnet',
    name: 'Ghostnet Testnet',
    description: 'Ghostnet testnet',
    rpcBaseURL: 'https://rpc.ghostnet.teztnets.com',
    chainId: TempleTezosChainId.Ghostnet,
    testnet: true,
    color: '#131380'
  }
];

export interface StoredEvmNetwork extends NetworkBase {
  chainId: number;
  currency: EvmNativeCurrency;
}

export interface EvmNativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

const DEFAULT_EVM_CURRENCY: EvmNativeCurrency = { name: 'Ether', symbol: 'ETH', decimals: 18 };

export const DEFAULT_EVM_NETWORKS: NonEmptyArray<StoredEvmNetwork> = [
  {
    id: 'mainnet',
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcBaseURL: 'https://cloudflare-eth.com',
    currency: DEFAULT_EVM_CURRENCY,
    color: '#83b300'
  },
  {
    id: 'optimism',
    chainId: 10,
    name: 'OP Mainnet',
    description: 'Optimism Mainnet',
    rpcBaseURL: 'https://mainnet.optimism.io',
    currency: DEFAULT_EVM_CURRENCY,
    color: '#48bb78'
  },
  {
    id: 'arbitrum',
    chainId: 42_161,
    name: 'Arbitrum One',
    rpcBaseURL: 'https://arb1.arbitrum.io/rpc',
    currency: DEFAULT_EVM_CURRENCY,
    color: '#047857'
  },
  {
    id: 'polygon',
    chainId: 137,
    name: 'Polygon',
    rpcBaseURL: 'https://polygon-rpc.com',
    currency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    color: '#34D399'
  }
];
