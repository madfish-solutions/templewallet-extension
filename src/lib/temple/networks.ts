import { getMessage } from 'lib/i18n';
import { TempleChainId, TempleNetwork } from 'lib/temple/types';

const formatDateToRPCFormat = (date: Date) => date.toLocaleDateString('en-GB').split('/').reverse().join('-');

const getLastMonday = (date = new Date()) => {
  const dateCopy = new Date(date.getTime() - 604800000);

  const nextMonday = new Date(dateCopy.setDate(dateCopy.getDate() + ((7 - dateCopy.getDay() + 1) % 7 || 7)));

  return formatDateToRPCFormat(nextMonday);
};

export const NETWORK_IDS = new Map<string, string>([
  [TempleChainId.Mainnet, 'mainnet'],
  [TempleChainId.Ghostnet, 'ghostnet'],
  [TempleChainId.Jakartanet, 'jakartanet']
]);

export const NETWORKS: TempleNetwork[] = [
  {
    id: 'mainnet',
    name: getMessage('tezosMainnet'),
    nameI18nKey: 'tezosMainnet',
    description: 'Tezos mainnet',
    type: 'main',
    rpcBaseURL: 'https://mainnet-node.madfish.solutions',
    color: '#83b300',
    disabled: false
  },
  {
    id: 'giganode-mainnet',
    name: 'Mainnet @giganode.io',
    description: 'Highly available Tezos Mainnet nodes operated by Giganode',
    type: 'main',
    rpcBaseURL: 'https://mainnet-tezos.giganode.io',
    color: '#059669',
    disabled: false
  },
  {
    id: 'smartpy-mainnet',
    name: 'Mainnet @smartpy.io',
    description: 'SmartPy Mainnet',
    type: 'main',
    rpcBaseURL: 'https://mainnet.smartpy.io',
    color: '#34D399',
    disabled: false
  },
  {
    id: 'tzbeta-mainnet',
    name: 'Mainnet @tzbeta.net',
    description: 'Highly available Tezos Mainnet nodes operated by Blockscale',
    type: 'main',
    rpcBaseURL: 'https://rpc.tzbeta.net',
    color: '#10B981',
    disabled: false
  },
  {
    id: 'tezie-mainnet',
    name: 'Mainnet @api.tez.ie',
    description: 'Highly available Tezos Mainnet nodes operated by ECAD Labs',
    type: 'main',
    rpcBaseURL: 'https://mainnet.api.tez.ie',
    color: '#047857',
    disabled: false
  },
  {
    id: 't4l3nt-mainnet',
    name: 'T4L3NT Mainnet',
    description: 'Decentralized pictures Betanet',
    type: 'dcp',
    rpcBaseURL: 'https://rpc.decentralized.pictures',
    color: '#047857',
    disabled: false
  },
  {
    id: 't4l3nt-testnet',
    name: 'T4L3NT Testnet',
    description: 'Decentralized pictures testnet',
    type: 'dcp',
    rpcBaseURL: 'https://staging-rpc.decentralized.pictures/',
    color: '#131380',
    disabled: false
  },
  {
    id: 'ghostnet',
    name: 'Ghostnet Testnet',
    description: 'Ghostnet testnet',
    type: 'test',
    rpcBaseURL: 'https://rpc.ghostnet.teztnets.xyz/',
    color: '#131380',
    disabled: false
  },
  {
    id: 'jakartanet',
    name: 'Jakartanet Testnet',
    description: 'Jakartanet testnet',
    type: 'test',
    rpcBaseURL: 'https://jakartanet.tezos.marigold.dev/',
    color: '#232380',
    disabled: false
  },
  {
    id: 'kathmandunet',
    name: 'Kathmandunet Testnet',
    description: 'Kathmandunet testnet',
    type: 'test',
    rpcBaseURL: 'https://rpc.kathmandunet.teztnets.xyz/',
    color: '#FBBF24',
    disabled: false
  },
  {
    id: 'monday',
    name: 'MondayNet',
    description: `MondayNet ${getLastMonday()}`,
    type: 'test',
    rpcBaseURL: `https://rpc.mondaynet-${getLastMonday()}.teztnets.xyz/`,
    color: '#FBBF24',
    disabled: false
  },
  {
    id: 'daily',
    name: 'DailyNet',
    description: 'DailyNet',
    type: 'test',
    rpcBaseURL: `https://rpc.dailynet-${formatDateToRPCFormat(new Date())}.teztnets.xyz/`,
    color: '#FBBF24',
    disabled: false
  },
  {
    id: 'sandbox',
    name: 'localhost:8732',
    description: 'Local Sandbox',
    type: 'test',
    rpcBaseURL: 'http://localhost:8732',
    color: '#e9e1cc',
    disabled: false
  },
  // Hidden
  {
    id: 'smartpy-ithacanet',
    name: 'Ithacanet Testnet Smartpy',
    description: 'Ithacanet testnet',
    type: 'test',
    rpcBaseURL: 'https://ithacanet.smartpy.io',
    color: '#FBBF24',
    disabled: false,
    hidden: true
  },
  {
    id: 'tzbeta-rpczero',
    name: 'Edo Testnet @rpczero.tzbeta.net',
    description: 'Highly available Edo Testnet nodes operated by Blockscale',
    type: 'test',
    rpcBaseURL: 'https://rpczero.tzbeta.net',
    color: '#FBBF24',
    disabled: false,
    hidden: true
  }
];
