import { TempleTezosChainId } from 'lib/temple/types';

export const TZKT_API_BASE_URLS = {
  [TempleTezosChainId.Mainnet]: 'https://api.tzkt.io/v1',
  [TempleTezosChainId.Mumbai]: 'https://api.mumbainet.tzkt.io/v1',
  [TempleTezosChainId.Nairobi]: 'https://api.nairobinet.tzkt.io/v1',
  [TempleTezosChainId.Ghostnet]: 'https://api.ghostnet.tzkt.io/v1',
  [TempleTezosChainId.Dcp]: 'https://explorer-api.tlnt.net/v1',
  [TempleTezosChainId.DcpTest]: 'https://explorer-api.test.tlnt.net/v1'
};
