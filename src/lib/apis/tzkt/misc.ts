import { TempleTezosChainId } from 'lib/temple/types';

export const TZKT_API_BASE_URLS = {
  [TempleTezosChainId.Mainnet]: 'https://api.tzkt.io/v1',
  [TempleTezosChainId.Ghostnet]: 'https://api.ghostnet.tzkt.io/v1',
  [TempleTezosChainId.Shadownet]: 'https://api.shadownet.tzkt.io/v1',
  [TempleTezosChainId.Tezlink]: 'https://api.shadownet.tezlink.tzkt.io/v1',
  [TempleTezosChainId.Rio]: 'https://api.rionet.tzkt.io/v1',
  [TempleTezosChainId.Seoul]: 'https://api.seoulnet.tzkt.io/v1',
  [TempleTezosChainId.Dcp]: 'https://explorer-api.tlnt.net/v1',
  [TempleTezosChainId.DcpTest]: 'https://explorer-api.test.tlnt.net/v1'
};
