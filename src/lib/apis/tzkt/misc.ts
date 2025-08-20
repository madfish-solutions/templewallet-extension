import { TempleTezosChainId } from 'lib/temple/types';

export const TZKT_API_BASE_URLS = {
  //TODO: revert after test
  [TempleTezosChainId.Mainnet]: 'https://staging.api.tzkt.io/v1',
  [TempleTezosChainId.Ghostnet]: 'https://new.api.ghostnet.tzkt.io/v1',
  [TempleTezosChainId.Paris]: 'https://api.parisnet.tzkt.io/v1',
  [TempleTezosChainId.Dcp]: 'https://explorer-api.tlnt.net/v1',
  [TempleTezosChainId.DcpTest]: 'https://explorer-api.test.tlnt.net/v1'
};
