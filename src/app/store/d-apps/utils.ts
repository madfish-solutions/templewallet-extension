import BigNumber from 'bignumber.js';
import { map } from 'rxjs';

import { getYOUTokenApr$, getYouvesTokenApr$ } from 'lib/apis/youves';
import { YouvesTokensEnum } from 'lib/apis/youves/enums';
import { youvesTokensRecord } from 'lib/apis/youves/utils';
import { fetchApyFromYupana$ } from 'lib/apis/yupana';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { TezosNetworkEssentials } from 'temple/networks';
import { getTezosReadOnlyRpcClient } from 'temple/tezos';

import { ExchangeRateRecord } from '../currency/state';

export const fetchKUSDApy$ = () => {
  const slug = KNOWN_TOKENS_SLUGS.KUSD;
  return fetchApyFromYupana$('KUSD').pipe(map(val => ({ [slug]: val })));
};

export const fetchUSDTApy$ = () => {
  const slug = KNOWN_TOKENS_SLUGS.USDT;
  return fetchApyFromYupana$('USDT').pipe(map(val => ({ [slug]: val })));
};

export const fetchTzBtcApy$ = () => {
  const slug = KNOWN_TOKENS_SLUGS.TZBTC;
  return fetchApyFromYupana$('TZBTC').pipe(map(val => ({ [slug]: val })));
};

export const fetchUBTCApr$ = (network: TezosNetworkEssentials) => {
  const slug = KNOWN_TOKENS_SLUGS.UBTC;
  const tezos = getTezosReadOnlyRpcClient(network);

  return getYouvesTokenApr$(tezos, youvesTokensRecord[YouvesTokensEnum.UBTC]).pipe(map(value => ({ [slug]: value })));
};

export const fetchUUSDCApr$ = (network: TezosNetworkEssentials) => {
  const slug = KNOWN_TOKENS_SLUGS.UUSD;
  const tezos = getTezosReadOnlyRpcClient(network);

  return getYouvesTokenApr$(tezos, youvesTokensRecord[YouvesTokensEnum.UUSD]).pipe(map(value => ({ [slug]: value })));
};

export const fetchYOUApr$ = (network: TezosNetworkEssentials, tokenUsdExchangeRates: ExchangeRateRecord) => {
  const slug = KNOWN_TOKENS_SLUGS.YOU;
  const tezos = getTezosReadOnlyRpcClient(network);
  const assetToUsdExchangeRate = new BigNumber(tokenUsdExchangeRates[slug]);

  return getYOUTokenApr$(tezos, assetToUsdExchangeRate, assetToUsdExchangeRate).pipe(map(value => ({ [slug]: value })));
};
