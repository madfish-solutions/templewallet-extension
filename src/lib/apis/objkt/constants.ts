import { getApolloConfigurableClient } from '../apollo';

const OBJKT_API = 'https://data.objkt.com/v3/graphql/';

export const apolloObjktClient = getApolloConfigurableClient(OBJKT_API);

interface ObjktCurrencyInfo {
  symbol: string;
  decimals: number;
  contract: string | null;
  id: string | null;
}

export const objktCurrencies: Record<number, ObjktCurrencyInfo> = {
  2537: {
    symbol: 'uUSD',
    decimals: 12,
    contract: 'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW',
    id: '0'
  },
  2557: {
    symbol: 'USDtz',
    decimals: 6,
    contract: 'KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9',
    id: '0'
  },
  1: {
    symbol: 'TEZ',
    decimals: 6,
    contract: null,
    id: null
  },
  4: {
    symbol: 'oXTZ',
    decimals: 6,
    contract: 'KT1TjnZYs5CGLbmV6yuW169P8Pnr9BiVwwjz',
    id: '0'
  },
  3: {
    symbol: 'USDtz',
    decimals: 6,
    contract: 'KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9',
    id: '0'
  }
};
