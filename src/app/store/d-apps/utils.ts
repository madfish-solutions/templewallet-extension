import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { map, Observable, withLatestFrom } from 'rxjs';

import { fetchApyFromYupana$ } from 'lib/apis/yupana';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';

import { getYOUTokenApr$, getYouvesTokenApr$ } from '../../../lib/apis/youves';
import { YouvesTokensEnum } from '../../../lib/apis/youves/enums';
import { youvesTokensRecord } from '../../../lib/apis/youves/utils';
import { ExchangeRateRecord } from '../currency/state';
import { RootState } from '../index';

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

export const fetchUBTCApr$ = (tezos: TezosToolkit) => {
  const slug = KNOWN_TOKENS_SLUGS.UBTC;

  return getYouvesTokenApr$(tezos, youvesTokensRecord[YouvesTokensEnum.UBTC]).pipe(map(value => ({ [slug]: value })));
};

export const fetchUUSDCApr$ = (tezos: TezosToolkit) => {
  const slug = KNOWN_TOKENS_SLUGS.UUSD;

  return getYouvesTokenApr$(tezos, youvesTokensRecord[YouvesTokensEnum.UUSD]).pipe(map(value => ({ [slug]: value })));
};

export const fetchYOUApr$ = (tezos: TezosToolkit, tokenUsdExchangeRates: ExchangeRateRecord) => {
  const slug = KNOWN_TOKENS_SLUGS.YOU;
  const assetToUsdExchangeRate = new BigNumber(tokenUsdExchangeRates[slug]);

  return getYOUTokenApr$(tezos, assetToUsdExchangeRate, assetToUsdExchangeRate).pipe(map(value => ({ [slug]: value })));
};

export const withUsdToTokenRates =
  <T>(state$: Observable<RootState>) =>
  (observable$: Observable<T>) =>
    observable$.pipe(
      withLatestFrom(state$, (value, { currency }): [T, ExchangeRateRecord] => [value, currency.usdToTokenRates.data])
    );
