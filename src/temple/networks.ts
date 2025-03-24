import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetStandard } from 'lib/evm/types';
import type { TID } from 'lib/i18n';
import { EvmNativeTokenMetadata } from 'lib/metadata/types';
import {
  ETHEREUM_MAINNET_CHAIN_ID,
  ETH_SEPOLIA_CHAIN_ID,
  OTHER_COMMON_MAINNET_CHAIN_IDS,
  TempleTezosChainId
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
    chainId: ETHEREUM_MAINNET_CHAIN_ID,
    rpcBaseURL: 'https://cloudflare-eth.com',
    color: '#0036fc',
    default: true
  },
  {
    id: 'matic-mainnet',
    name: 'Polygon Mainnet',
    chain: TempleChainKind.EVM,
    chainId: OTHER_COMMON_MAINNET_CHAIN_IDS.polygon,
    rpcBaseURL: 'https://polygon-rpc.com',
    color: '#725ae8',
    default: true
  },
  {
    id: 'bsc-mainnet',
    name: 'BSC Mainnet',
    chain: TempleChainKind.EVM,
    chainId: OTHER_COMMON_MAINNET_CHAIN_IDS.bsc,
    rpcBaseURL: 'https://bsc-rpc.publicnode.com',
    description: 'Binance Smart Chain Mainnet',
    color: '#f5d300',
    default: true
  },
  {
    id: 'avalanche-mainnet',
    name: 'Avalanche Mainnet',
    chain: TempleChainKind.EVM,
    chainId: OTHER_COMMON_MAINNET_CHAIN_IDS.avalanche,
    rpcBaseURL: 'https://avalanche.drpc.org',
    color: '#ff5959',
    default: true
  },
  {
    id: 'optimism-mainnet',
    name: 'OP Mainnet',
    chain: TempleChainKind.EVM,
    chainId: OTHER_COMMON_MAINNET_CHAIN_IDS.optimism,
    rpcBaseURL: 'https://mainnet.optimism.io',
    description: 'Optimism Mainnet',
    color: '#fc0000',
    default: true
  },
  {
    id: 'etherlink-mainnet',
    name: 'Etherlink Mainnet',
    chain: TempleChainKind.EVM,
    chainId: OTHER_COMMON_MAINNET_CHAIN_IDS.etherlink,
    rpcBaseURL: 'https://node.mainnet.etherlink.com',
    description: 'Etherlink Mainnet',
    color: '#207449',
    default: true
  },
  {
    id: 'eth-sepolia',
    name: 'Ethereum Sepolia',
    chain: TempleChainKind.EVM,
    chainId: ETH_SEPOLIA_CHAIN_ID,
    rpcBaseURL: 'https://ethereum-sepolia-rpc.publicnode.com',
    color: '#010b79',
    default: true
  },
  {
    id: 'polygon-amoy',
    name: 'Polygon Amoy',
    chain: TempleChainKind.EVM,
    chainId: 80002,
    rpcBaseURL: 'https://rpc-amoy.polygon.technology',
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
  },
  {
    id: 'etherlink-ghostnet',
    name: 'Etherlink Testnet',
    chain: TempleChainKind.EVM,
    chainId: 128123,
    rpcBaseURL: 'https://node.ghostnet.etherlink.com',
    description: 'Etherlink Testnet (Ghostnet)',
    color: '#144c2f',
    default: true
  }
];
