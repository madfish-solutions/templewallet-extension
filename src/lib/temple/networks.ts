import { getMessage } from 'lib/i18n';
import { TempleChainId, TempleNetwork } from 'lib/temple/types';

export const KNOWN_LAMBDA_CONTRACTS = new Map([
  [TempleChainId.Mainnet, 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE'],
  [TempleChainId.Granadanet, 'KT1VhtTGAyh7AVVwyH2ExNhaXvQq2rAJ6DNs'],
  [TempleChainId.Hangzhounet, 'KT1Uu5atnGR8m7S6i1rvTB3r71PPqHBDfkSS'],
  [TempleChainId.Florencenet, 'KT1BbTmNHmJp2NnQyw5qsAExEYmYuUpR2HdX'],
  [TempleChainId.Edo2net, 'KT1A64nVZDccAHGAsf1ZyVajXZcbiwjV3SnN'],
  [TempleChainId.Delphinet, 'KT1EC1oaF3LwjiPto3fpUZiS3sWYuQHGxqXM'],
  [TempleChainId.Carthagenet, 'KT1PCtQTdgD44WsYgTzAUUztMcrDmPiSuSV1']
]);

export const NETWORK_IDS = new Map<string, string>([
  [TempleChainId.Mainnet, 'mainnet'],
  [TempleChainId.Granadanet, 'granadanet'],
  [TempleChainId.Hangzhounet, 'hangzhounet'],
  [TempleChainId.Florencenet, 'florencenet'],
  [TempleChainId.Edo2net, 'edo2net'],
  [TempleChainId.Delphinet, 'delphinet'],
  [TempleChainId.Carthagenet, 'carthagenet']
]);

export const NETWORKS: TempleNetwork[] = [
  {
    id: 'mainnet',
    name: getMessage('tezosMainnet'),
    nameI18nKey: 'tezosMainnet',
    description: 'Tezos mainnet',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://mainnet-node.madfish.solutions',
    color: '#83b300',
    disabled: false
  },
  {
    id: 'giganode-mainnet',
    name: 'Mainnet @giganode.io',
    description: 'Highly available Tezos Mainnet nodes operated by Giganode',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://mainnet-tezos.giganode.io',
    color: '#059669',
    disabled: false
  },
  {
    id: 'smartpy-mainnet',
    name: 'Mainnet @smartpy.io',
    description: 'SmartPy Mainnet',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://mainnet.smartpy.io',
    color: '#34D399',
    disabled: false
  },
  {
    id: 'tzbeta-mainnet',
    name: 'Mainnet @tzbeta.net',
    description: 'Highly available Tezos Mainnet nodes operated by Blockscale',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://rpc.tzbeta.net',
    color: '#10B981',
    disabled: false
  },
  {
    id: 'tezie-mainnet',
    name: 'Mainnet @api.tez.ie',
    description: 'Highly available Tezos Mainnet nodes operated by ECAD Labs',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://mainnet.api.tez.ie',
    color: '#047857',
    disabled: false
  },
  {
    id: 'granadanet',
    name: 'Granada Testnet',
    description: 'Granada testnet',
    lambdaContract: 'KT1VhtTGAyh7AVVwyH2ExNhaXvQq2rAJ6DNs',
    type: 'test',
    rpcBaseURL: 'https://granadanet.smartpy.io',
    color: '#667eea',
    disabled: false
  },
  {
    id: 'hangzhounet',
    name: 'Hangzhounet Testnet',
    description: 'Hangzhounet testnet',
    lambdaContract: 'KT1Uu5atnGR8m7S6i1rvTB3r71PPqHBDfkSS',
    type: 'test',
    rpcBaseURL: 'https://hangzhounet.smartpy.io',
    color: '#b83280',
    disabled: false
  },
  {
    id: 'florencenet',
    name: 'Florence Testnet',
    description: 'Florence testnet',
    lambdaContract: 'KT1BbTmNHmJp2NnQyw5qsAExEYmYuUpR2HdX',
    type: 'test',
    rpcBaseURL: 'https://florencenet.smartpy.io',
    color: '#FFD88A',
    disabled: false
  },
  {
    id: 'edo2net',
    name: 'Edo2 Testnet',
    description: 'Edo2 testnet',
    lambdaContract: 'KT1A64nVZDccAHGAsf1ZyVajXZcbiwjV3SnN',
    type: 'test',
    rpcBaseURL: 'https://edonet.smartpy.io',
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
    id: 'giganode-testnet',
    name: 'Florence Testnet @giganode',
    description: 'Highly available Tezos Mainnet nodes operated by Giganode',
    type: 'test',
    rpcBaseURL: 'https://testnet-tezos.giganode.io',
    color: '#83b300',
    disabled: false,
    hidden: true
  },
  {
    id: 'tzbeta-testnet',
    name: 'Florence Testnet @rpctest.tzbeta.net',
    description: 'Highly available Delphi Testnet nodes operated by Blockscale',
    type: 'test',
    rpcBaseURL: 'https://rpctest.tzbeta.net',
    color: '#ed6663',
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
  },
  {
    id: 'tezie-delphinet',
    name: 'Delphi Testnet @api.tez.ie',
    description: 'Highly available Delphi Testnet nodes operated by ECAD Labs',
    type: 'test',
    rpcBaseURL: 'https://api.tez.ie/rpc/delphinet',
    color: '#ed6663',
    disabled: false,
    hidden: true
  },
  {
    id: 'tezie-edonet',
    name: 'Edo Testnet @api.tez.ie',
    description: 'Highly available Edo Testnet nodes operated by ECAD Labs',
    type: 'test',
    rpcBaseURL: 'https://api.tez.ie/rpc/edonet',
    color: '#FBBF24',
    disabled: false,
    hidden: true
  },
  {
    id: 'pointninja-mainnet',
    name: 'Tezos Mainnet @mainnet.point.ninja',
    description: 'Highly available Tezos Mainnet nodes operated by Point Ninja',
    type: 'main',
    rpcBaseURL: 'https://mainnet.point.ninja',
    color: '#83b300',
    disabled: false,
    hidden: true
  },
  {
    id: 'madfish-mainnet',
    name: 'Tezos Mainnet @mainnet-node.madfish.solutions',
    description: 'Highly available Tezos Mainnet nodes operated by Madfish Solutions',
    type: 'main',
    rpcBaseURL: 'https://mainnet-node.madfish.solutions',
    color: '#83b300',
    disabled: false,
    hidden: true
  }
];
