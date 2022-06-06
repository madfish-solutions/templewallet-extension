import { getMessage } from 'lib/i18n';
import { TempleChainId, TempleNetwork } from 'lib/temple/types';

export const NETWORK_IDS = new Map<string, string>([
  [TempleChainId.Mainnet, 'mainnet'],
  [TempleChainId.Ithacanet, 'ithacanet'],
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
    id: 'ithacanet',
    name: 'Ithacanet Testnet',
    description: 'Ithacanet testnet',
    type: 'test',
    rpcBaseURL: 'https://ithacanet.ecadinfra.com/',
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
