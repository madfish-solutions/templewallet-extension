import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetStandard } from 'lib/evm/types';
import type { TID } from 'lib/i18n';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import {
  ETHEREUM_MAINNET_CHAIN_ID,
  ETH_SEPOLIA_CHAIN_ID,
  COMMON_MAINNET_CHAIN_IDS,
  TempleTezosChainId,
  COMMON_TESTNET_CHAIN_IDS
} from 'lib/temple/types';

import { TempleChainKind } from './types';

export interface TezosNetworkEssentials {
  rpcBaseURL: string;
  chainId: string;
}

export interface EvmNetworkEssentials {
  rpcBaseURL: string;
  chainId: number;
}

export type NetworkEssentials<T extends TempleChainKind> = T extends TempleChainKind.Tezos
  ? TezosNetworkEssentials
  : EvmNetworkEssentials;

export const isTezosNetworkEssentials = (
  essentials: TezosNetworkEssentials | EvmNetworkEssentials
): essentials is TezosNetworkEssentials => typeof essentials.chainId === 'string';

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

/** (!) Never remove Mainnet */
export const TEZOS_DEFAULT_NETWORKS: NonEmptyArray<StoredTezosNetwork> = [
  {
    id: 'mainnet',
    name: 'Tezos',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Mainnet,
    rpcBaseURL: 'https://prod.tcinfra.net/rpc/mainnet',
    description: 'Tezos mainnet',
    color: '#83b300',
    default: true
  },
  {
    id: 'smartpy-mainnet',
    name: 'SmartPy',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Mainnet,
    rpcBaseURL: 'https://mainnet.smartpy.io',
    description: 'SmartPy Mainnet',
    color: '#34D399'
  },
  {
    id: 'tezie-mainnet',
    name: 'ECAD Labs',
    chain: TempleChainKind.Tezos,
    chainId: TempleTezosChainId.Mainnet,
    rpcBaseURL: 'https://mainnet.api.tez.ie',
    description: 'Highly available Tezos Mainnet nodes operated by ECAD Labs',
    color: '#047857'
  },
  {
    id: 'ghostnet',
    name: 'Ghostnet',
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

export const DEFAULT_EVM_CURRENCY: EvmNativeTokenMetadata = {
  standard: EvmAssetStandard.NATIVE,
  address: EVM_TOKEN_SLUG,
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18
};

export const ETHERLINK_RPC_URL = 'https://node.mainnet.etherlink.com';

export const EVM_FALLBACK_RPC_URLS: Record<number, string[]> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: [
    'https://ethereum-rpc.publicnode.com',
    'https://cloudflare-eth.com',
    'https://eth.llamarpc.com',
    'https://eth.drpc.org',
    'https://eth.meowrpc.com',
    'https://endpoints.omniatech.io/v1/eth/mainnet/public'
  ],
  [COMMON_MAINNET_CHAIN_IDS.polygon]: [
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon-rpc.com',
    'https://polygon.drpc.org',
    'https://polygon.meowrpc.com',
    'https://endpoints.omniatech.io/v1/matic/mainnet/public',
    'https://1rpc.io/matic'
  ],
  [COMMON_MAINNET_CHAIN_IDS.bsc]: [
    'https://bsc-rpc.publicnode.com',
    'https://binance.llamarpc.com',
    'https://bsc.drpc.org',
    'https://bsc.meowrpc.com',
    'https://endpoints.omniatech.io/v1/bsc/mainnet/public',
    'https://1rpc.io/bnb'
  ],
  [COMMON_MAINNET_CHAIN_IDS.avalanche]: [
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://avalanche.drpc.org',
    'https://avax.meowrpc.com',
    'https://endpoints.omniatech.io/v1/avax/mainnet/public',
    'https://1rpc.io/avax/c'
  ],
  [COMMON_MAINNET_CHAIN_IDS.optimism]: [
    'https://optimism-rpc.publicnode.com',
    'https://mainnet.optimism.io',
    'https://optimism.drpc.org',
    'https://optimism.meowrpc.com',
    'https://1rpc.io/op'
  ],
  [ETH_SEPOLIA_CHAIN_ID]: [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.drpc.org',
    'https://1rpc.io/sepolia'
  ],
  [COMMON_TESTNET_CHAIN_IDS.polygon]: [
    'https://polygon-amoy-bor-rpc.publicnode.com',
    'https://rpc-amoy.polygon.technology',
    'https://polygon-amoy.drpc.org'
  ],
  [COMMON_TESTNET_CHAIN_IDS.bsc]: [
    'https://bsc-testnet-rpc.publicnode.com',
    'https://bsc-testnet.drpc.org',
    'https://endpoints.omniatech.io/v1/bsc/testnet/public'
  ],
  [COMMON_TESTNET_CHAIN_IDS.avalanche]: [
    'https://avalanche-fuji-c-chain-rpc.publicnode.com',
    'https://avalanche-fuji.drpc.org',
    'https://endpoints.omniatech.io/v1/avax/fuji/public'
  ],
  [COMMON_TESTNET_CHAIN_IDS.optimism]: [
    'https://optimism-sepolia-rpc.publicnode.com',
    'https://endpoints.omniatech.io/v1/op/sepolia/public',
    'https://sepolia.optimism.io'
  ]
};

/** (!) Never remove Mainnet */
export const EVM_DEFAULT_NETWORKS: NonEmptyArray<StoredEvmNetwork> = [
  {
    id: 'eth-mainnet',
    name: 'Ethereum',
    chain: TempleChainKind.EVM,
    chainId: ETHEREUM_MAINNET_CHAIN_ID,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[ETHEREUM_MAINNET_CHAIN_ID][0],
    color: '#0036fc',
    default: true
  },
  {
    id: 'matic-mainnet',
    name: 'Polygon',
    chain: TempleChainKind.EVM,
    chainId: COMMON_MAINNET_CHAIN_IDS.polygon,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[COMMON_MAINNET_CHAIN_IDS.polygon][0],
    color: '#725ae8',
    default: true
  },
  {
    id: 'bsc-mainnet',
    name: 'BSC',
    chain: TempleChainKind.EVM,
    chainId: COMMON_MAINNET_CHAIN_IDS.bsc,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[COMMON_MAINNET_CHAIN_IDS.bsc][0],
    description: 'Binance Smart Chain Mainnet',
    color: '#f5d300',
    default: true
  },
  {
    id: 'avalanche-mainnet',
    name: 'Avalanche',
    chain: TempleChainKind.EVM,
    chainId: COMMON_MAINNET_CHAIN_IDS.avalanche,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[COMMON_MAINNET_CHAIN_IDS.avalanche][0],
    color: '#ff5959',
    default: true
  },
  {
    id: 'optimism-mainnet',
    name: 'Optimism',
    chain: TempleChainKind.EVM,
    chainId: COMMON_MAINNET_CHAIN_IDS.optimism,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[COMMON_MAINNET_CHAIN_IDS.optimism][0],
    description: 'Optimism',
    color: '#fc0000',
    default: true
  },
  {
    id: 'etherlink-mainnet',
    name: 'Etherlink',
    chain: TempleChainKind.EVM,
    chainId: COMMON_MAINNET_CHAIN_IDS.etherlink,
    rpcBaseURL: ETHERLINK_RPC_URL,
    description: 'Etherlink Mainnet',
    color: '#207449',
    default: true
  },
  {
    id: 'eth-sepolia',
    name: 'Ethereum Sepolia',
    chain: TempleChainKind.EVM,
    chainId: ETH_SEPOLIA_CHAIN_ID,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[ETH_SEPOLIA_CHAIN_ID][0],
    color: '#010b79',
    default: true
  },
  {
    id: 'polygon-amoy',
    name: 'Polygon Amoy',
    chain: TempleChainKind.EVM,
    chainId: COMMON_TESTNET_CHAIN_IDS.polygon,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[COMMON_TESTNET_CHAIN_IDS.polygon][0],
    color: '#392f77',
    default: true
  },
  {
    id: 'bsc-testnet',
    name: 'BSC',
    chain: TempleChainKind.EVM,
    chainId: COMMON_TESTNET_CHAIN_IDS.bsc,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[COMMON_TESTNET_CHAIN_IDS.bsc][0],
    description: 'Binance Smart Chain Testnet',
    color: '#867000',
    default: true
  },
  {
    id: 'avalanche-testnet',
    name: 'Avalanche Fuji',
    chain: TempleChainKind.EVM,
    chainId: COMMON_TESTNET_CHAIN_IDS.avalanche,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[COMMON_TESTNET_CHAIN_IDS.avalanche][0],
    description: 'Avalanche Testnet',
    color: '#812e2e',
    default: true
  },
  {
    id: 'optimism-sepolia',
    name: 'OP Sepolia',
    chain: TempleChainKind.EVM,
    chainId: COMMON_TESTNET_CHAIN_IDS.optimism,
    rpcBaseURL: EVM_FALLBACK_RPC_URLS[COMMON_TESTNET_CHAIN_IDS.optimism][0],
    description: 'Optimism Testnet',
    color: '#fc0000',
    default: true
  },
  {
    id: 'etherlink-ghostnet',
    name: 'Etherlink',
    chain: TempleChainKind.EVM,
    chainId: 128123,
    rpcBaseURL: 'https://node.ghostnet.etherlink.com',
    description: 'Etherlink Testnet (Ghostnet)',
    color: '#144c2f',
    default: true
  }
];
