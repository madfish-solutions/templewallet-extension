import type { TID } from 'lib/i18n';

export interface NetworkBase {
  id: string;
  rpcBaseURL: string;
  name: string;
  nameI18nKey?: TID;
  description?: string;
  color: string;
  // TODO: testnet?: boolean;
  // Deprecated params:
  /** @deprecated */
  type?: 'main' | 'test' | 'dcp';
  /** @deprecated // (i) No persisted item had it set to `true` */
  disabled?: boolean;
}

export type StoredTezosNetwork =
  | (NetworkBase & {
      nameI18nKey: TID;
    })
  | (NetworkBase & {
      name: string;
    });

const formatDateToRPCFormat = (date: Date) => date.toLocaleDateString('en-GB').split('/').reverse().join('-');

const getLastMonday = (date = new Date()) => {
  const dateCopy = new Date(date.getTime() - 604800000);

  const nextMonday = new Date(dateCopy.setDate(dateCopy.getDate() + ((7 - dateCopy.getDay() + 1) % 7 || 7)));

  return formatDateToRPCFormat(nextMonday);
};

const DCP_TEZOS_NETWORKS: StoredTezosNetwork[] = [
  {
    id: 't4l3nt-mainnet',
    name: 'T4L3NT Mainnet',
    description: 'Decentralized pictures Betanet',
    rpcBaseURL: 'https://rpc.decentralized.pictures',
    color: '#047857'
  },
  {
    id: 't4l3nt-testnet',
    name: 'T4L3NT Testnet',
    description: 'Decentralized pictures testnet',
    rpcBaseURL: 'https://staging-rpc.decentralized.pictures/',
    color: '#131380'
  }
];

export const DEFAULT_TEZOS_NETWORKS: NonEmptyArray<StoredTezosNetwork> = [
  {
    id: 'mainnet',
    name: 'Tezos Mainnet',
    nameI18nKey: 'tezosMainnet',
    description: 'Tezos mainnet',
    rpcBaseURL: 'https://prod.tcinfra.net/rpc/mainnet',
    color: '#83b300'
  },
  {
    id: 'marigold-mainnet',
    name: 'Marigold Mainnet',
    nameI18nKey: 'marigoldMainnet',
    description: 'Marigold mainnet',
    rpcBaseURL: 'https://mainnet.tezos.marigold.dev',
    color: '#48bb78'
  },
  {
    id: 'smartpy-mainnet',
    name: 'SmartPy Mainnet',
    description: 'SmartPy Mainnet',
    rpcBaseURL: 'https://mainnet.smartpy.io',
    color: '#34D399'
  },
  {
    id: 'tezie-mainnet',
    name: 'ECAD Labs Mainnet',
    description: 'Highly available Tezos Mainnet nodes operated by ECAD Labs',
    rpcBaseURL: 'https://mainnet.api.tez.ie',
    color: '#047857'
  },
  ...DCP_TEZOS_NETWORKS,
  {
    id: 'ghostnet',
    name: 'Ghostnet Testnet',
    description: 'Ghostnet testnet',
    rpcBaseURL: 'https://rpc.ghostnet.teztnets.com',
    color: '#131380'
  },
  {
    id: 'monday',
    name: 'MondayNet Testnet',
    description: `MondayNet ${getLastMonday()}`,
    rpcBaseURL: `https://rpc.mondaynet-${getLastMonday()}.teztnets.xyz/`,
    color: '#FBBF24'
  },
  {
    id: 'daily',
    name: 'DailyNet Testnet',
    description: 'DailyNet',
    rpcBaseURL: `https://rpc.dailynet-${formatDateToRPCFormat(new Date())}.teztnets.xyz/`,
    color: '#FBBF24'
  },
  {
    id: 'sandbox',
    name: 'localhost:8732',
    description: 'Local Sandbox',
    rpcBaseURL: 'http://localhost:8732',
    color: '#e9e1cc'
  }
];

export const HIDDEN_TEZOS_NETWORKS: StoredTezosNetwork[] = [
  {
    id: 'smartpy-ithacanet',
    name: 'Ithacanet Testnet Smartpy',
    description: 'Ithacanet testnet',
    rpcBaseURL: 'https://ithacanet.smartpy.io',
    color: '#FBBF24'
  },
  {
    id: 'tzbeta-rpczero',
    name: 'Edo Testnet @rpczero.tzbeta.net',
    description: 'Highly available Edo Testnet nodes operated by Blockscale',
    rpcBaseURL: 'https://rpczero.tzbeta.net',
    color: '#FBBF24'
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
