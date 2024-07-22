import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetStandard } from 'lib/evm/types';
import type { TID } from 'lib/i18n';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import { TempleTezosChainId } from 'lib/temple/types';

import { TempleChainKind } from './types';

export interface TezosNetworkEssentials {
  rpcBaseURL: string;
  chainId: string;
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

export const DEFAULT_EVM_CURRENCY: EvmNativeTokenMetadata = {
  standard: EvmAssetStandard.NATIVE,
  address: EVM_TOKEN_SLUG,
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18
};

/** (!) Never remove Mainnet */
export const EVM_DEFAULT_NETWORKS: NonEmptyArray<StoredEvmNetwork> = [
  {
    id: 'eth-mainnet',
    name: 'Ethereum Mainnet',
    chain: TempleChainKind.EVM,
    chainId: 1,
    rpcBaseURL: 'https://cloudflare-eth.com',
    color: '#0036fc',
    default: true
  },
  {
    id: 'matic-mainnet',
    name: 'Polygon Mainnet',
    chain: TempleChainKind.EVM,
    chainId: 137,
    rpcBaseURL: 'https://polygon-rpc.com',
    color: '#725ae8',
    default: true
  },
  {
    id: 'bsc-mainnet',
    name: 'BSC Mainnet',
    chain: TempleChainKind.EVM,
    chainId: 56,
    rpcBaseURL: 'https://bsc-rpc.publicnode.com',
    description: 'Binance Smart Chain Mainnet',
    color: '#f5d300',
    default: true
  },
  {
    id: 'avalanche-mainnet',
    name: 'Avalanche Mainnet',
    chain: TempleChainKind.EVM,
    chainId: 43114,
    rpcBaseURL: 'https://avalanche.drpc.org',
    color: '#ff5959',
    default: true
  },
  {
    id: 'optimism-mainnet',
    name: 'OP Mainnet',
    chain: TempleChainKind.EVM,
    chainId: 10,
    rpcBaseURL: 'https://mainnet.optimism.io',
    description: 'Optimism Mainnet',
    color: '#fc0000',
    default: true
  },
  {
    id: 'eth-sepolia',
    name: 'Ethereum Sepolia',
    chain: TempleChainKind.EVM,
    chainId: 11155111,
    rpcBaseURL: 'https://ethereum-sepolia-rpc.publicnode.com',
    color: '#010b79',
    default: true
  },
  {
    id: 'matic-mumbai',
    name: 'Polygon Mumbai',
    chain: TempleChainKind.EVM,
    chainId: 80001,
    rpcBaseURL: 'https://polygon-mumbai.gateway.tenderly.co',
    color: '#392f77',
    default: true
  },
  {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    chain: TempleChainKind.EVM,
    chainId: 97,
    rpcBaseURL: 'https://bsc-testnet-rpc.publicnode.com',
    description: 'Binance Smart Chain Testnet',
    color: '#867000',
    default: true
  },
  {
    id: 'avalanche-testnet',
    name: 'Avalanche Fuji',
    chain: TempleChainKind.EVM,
    chainId: 43113,
    rpcBaseURL: 'https://endpoints.omniatech.io/v1/avax/fuji/public',
    description: 'Avalanche Testnet',
    color: '#812e2e',
    default: true
  },
  {
    id: 'optimism-sepolia',
    name: 'OP Sepolia',
    chain: TempleChainKind.EVM,
    chainId: 11155420,
    rpcBaseURL: 'https://endpoints.omniatech.io/v1/op/sepolia/public',
    description: 'Optimism Testnet',
    color: '#fc0000',
    default: true
  }
];
