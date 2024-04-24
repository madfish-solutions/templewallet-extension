import type { TID } from 'lib/i18n';
import { TempleTezosChainId } from 'lib/temple/types';

import { TempleChainKind } from './types';

export interface TezosNetworkEssentials {
  rpcBaseURL: string;
  chainId: string;
}

// ts-prune-ignore-next
export interface EvmNetworkEssentials {
  rpcBaseURL: string;
  chainId: number;
}

export interface NetworkBase {
  chain: TempleChainKind;
  id: string;
  rpcBaseURL: string;
  chainId: string | number;
  name: string;
  nameI18nKey?: TID;
  description?: string;
  /** TODO: Remove, when(if) deprecated */
  color: string;
  /** Means: hardcoded, never stored */
  default?: boolean;
  // Deprecated params:
  /** @deprecated */
  type?: 'main' | 'test' | 'dcp';
}

export interface StoredTezosNetwork extends NetworkBase {
  chain: TempleChainKind.Tezos;
  chainId: string;
}

const TEZOS_DCP_CHAIN_IDS: string[] = [TempleTezosChainId.Dcp, TempleTezosChainId.DcpTest];

export const isTezosDcpChainId = (chainId: string) => TEZOS_DCP_CHAIN_IDS.includes(chainId);

const TEZOS_DCP_NETWORKS: StoredTezosNetwork[] = [
  {
    id: 't4l3nt-mainnet',
    name: 'T4L3NT Mainnet',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Dcp,
    rpcBaseURL: 'https://rpc.decentralized.pictures',
    description: 'Decentralized pictures Betanet',
    color: '#047857',
    default: true
  },
  {
    id: 't4l3nt-testnet',
    name: 'T4L3NT Testnet',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.DcpTest,
    rpcBaseURL: 'https://staging-rpc.decentralized.pictures/',
    description: 'Decentralized pictures testnet',
    color: '#131380',
    default: true
  }
];

/** (!) Never remove Mainnet */
export const TEZOS_DEFAULT_NETWORKS: NonEmptyArray<StoredTezosNetwork> = [
  {
    id: 'mainnet',
    name: 'Tezos Mainnet',
    nameI18nKey: 'tezosMainnet',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Mainnet,
    rpcBaseURL: 'https://prod.tcinfra.net/rpc/mainnet',
    description: 'Tezos mainnet',
    color: '#83b300',
    default: true
  },
  {
    id: 'marigold-mainnet',
    name: 'Marigold Mainnet',
    nameI18nKey: 'marigoldMainnet',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Mainnet,
    rpcBaseURL: 'https://mainnet.tezos.marigold.dev',
    description: 'Marigold mainnet',
    color: '#48bb78',
    default: true
  },
  {
    id: 'smartpy-mainnet',
    name: 'SmartPy Mainnet',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Mainnet,
    rpcBaseURL: 'https://mainnet.smartpy.io',
    description: 'SmartPy Mainnet',
    color: '#34D399',
    default: true
  },
  {
    id: 'tezie-mainnet',
    name: 'ECAD Labs Mainnet',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Mainnet,
    rpcBaseURL: 'https://mainnet.api.tez.ie',
    description: 'Highly available Tezos Mainnet nodes operated by ECAD Labs',
    color: '#047857',
    default: true
  },
  ...TEZOS_DCP_NETWORKS,
  {
    id: 'ghostnet',
    name: 'Ghostnet Testnet',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Ghostnet,
    rpcBaseURL: 'https://rpc.ghostnet.teztnets.com',
    description: 'Ghostnet testnet',
    color: '#131380',
    default: true
  }
];

export interface StoredEvmNetwork extends NetworkBase {
  chain: TempleChainKind.EVM;
  chainId: number;
}

export interface EvmNativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export const DEFAULT_EVM_CURRENCY: EvmNativeCurrency = { name: 'Ether', symbol: 'ETH', decimals: 18 };

/** (!) Never remove Mainnet */
export const EVM_DEFAULT_NETWORKS: NonEmptyArray<StoredEvmNetwork> = [
  {
    id: 'mainnet',
    name: 'Ethereum Mainnet',
    chain: TempleChainKind.EVM,
    chainId: 1,
    rpcBaseURL: 'https://cloudflare-eth.com',
    color: '#83b300',
    default: true
  },
  {
    id: 'optimism',
    name: 'OP Mainnet',
    chain: TempleChainKind.EVM,
    chainId: 10,
    rpcBaseURL: 'https://mainnet.optimism.io',
    description: 'Optimism Mainnet',
    color: '#48bb78',
    default: true
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chain: TempleChainKind.EVM,
    chainId: 42_161,
    rpcBaseURL: 'https://arb1.arbitrum.io/rpc',
    color: '#047857',
    default: true
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chain: TempleChainKind.EVM,
    chainId: 137,
    rpcBaseURL: 'https://polygon-rpc.com',
    color: '#34D399',
    default: true
  }
];
