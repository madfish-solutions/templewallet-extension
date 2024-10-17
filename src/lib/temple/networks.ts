import { TempleChainId, TempleNetwork } from 'lib/temple/types';

export const NETWORK_IDS = new Map<string, string>([
  [TempleChainId.Mainnet, 'mainnet'],
  [TempleChainId.Ghostnet, 'ghostnet'],
  [TempleChainId.Mumbai, 'mumbainet'],
  [TempleChainId.Nairobi, 'nairobinet']
]);

const DCP_NETWORKS: TempleNetwork[] = [
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
  }
];

export const NETWORKS: TempleNetwork[] = [
  {
    id: 'mainnet',
    nameI18nKey: 'tezosMainnet',
    description: 'Tezos mainnet',
    type: 'main',
    rpcBaseURL: 'https://prod.tcinfra.net/rpc/mainnet',
    color: '#83b300',
    disabled: false
  },
  {
    id: 'smartpy-mainnet',
    name: 'SmartPy Mainnet',
    description: 'SmartPy Mainnet',
    type: 'main',
    rpcBaseURL: 'https://mainnet.smartpy.io',
    color: '#34D399',
    disabled: false
  },
  {
    id: 'tezie-mainnet',
    name: 'ECAD Labs Mainnet',
    description: 'Highly available Tezos Mainnet nodes operated by ECAD Labs',
    type: 'main',
    rpcBaseURL: 'https://mainnet.api.tez.ie',
    color: '#047857',
    disabled: false
  },
  ...DCP_NETWORKS,
  {
    id: 'ghostnet',
    name: 'Ghostnet Testnet',
    description: 'Ghostnet testnet',
    type: 'test',
    rpcBaseURL: 'https://rpc.ghostnet.teztnets.com',
    color: '#131380',
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
