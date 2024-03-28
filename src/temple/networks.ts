import { StoredNetwork } from 'lib/temple/types';

const formatDateToRPCFormat = (date: Date) => date.toLocaleDateString('en-GB').split('/').reverse().join('-');

const getLastMonday = (date = new Date()) => {
  const dateCopy = new Date(date.getTime() - 604800000);

  const nextMonday = new Date(dateCopy.setDate(dateCopy.getDate() + ((7 - dateCopy.getDay() + 1) % 7 || 7)));

  return formatDateToRPCFormat(nextMonday);
};

const DCP_TEZOS_NETWORKS: StoredNetwork[] = [
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

export const DEFAULT_TEZOS_NETWORKS: StoredNetwork[] = [
  {
    id: 'mainnet',
    nameI18nKey: 'tezosMainnet',
    description: 'Tezos mainnet',
    rpcBaseURL: 'https://prod.tcinfra.net/rpc/mainnet',
    color: '#83b300'
  },
  {
    id: 'marigold-mainnet',
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

export const HIDDEN_TEZOS_NETWORKS: StoredNetwork[] = [
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
