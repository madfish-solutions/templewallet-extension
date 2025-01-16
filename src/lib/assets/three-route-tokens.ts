import { Route3Token, Route3TokenStandardEnum } from 'lib/apis/route3/fetch-route3-tokens';

export const THREE_ROUTE_SIRS_TOKEN: Route3Token = {
  id: 127,
  symbol: 'SIRS',
  standard: Route3TokenStandardEnum.fa12,
  contract: 'KT1AafHA1C1vk959wvHWBispY9Y2f3fxBUUo',
  tokenId: null,
  decimals: 0
};

export const THREE_ROUTE_TEZ_TOKEN: Route3Token = {
  id: 0,
  symbol: 'XTZ',
  standard: Route3TokenStandardEnum.xtz,
  contract: null,
  tokenId: null,
  decimals: 6
};

export const THREE_ROUTE_TZBTC_TOKEN: Route3Token = {
  id: 2,
  symbol: 'TZBTC',
  standard: Route3TokenStandardEnum.fa12,
  contract: 'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn',
  tokenId: null,
  decimals: 8
};
