import { map } from 'rxjs';

import { fetchKordFiTzBtcApy$ } from 'lib/apis/kord-fi';
import { fetchApyFromYupana$ } from 'lib/apis/yupana';
import { KNOWN_TOKENS_SLUGS } from 'lib/temple/assets';

export const YUPANA_LEND_LINK = 'https://app.yupana.finance/lending';
export const KORDFI_LEND_LINK = 'https://kord.fi/lend';

export const fetchKUSDApy$ = () => {
  const slug = KNOWN_TOKENS_SLUGS.KUSD;
  return fetchApyFromYupana$('KUSD').pipe(map(val => ({ [slug]: val })));
};

export const fetchUSDTApy$ = () => {
  const slug = KNOWN_TOKENS_SLUGS.USDT;
  return fetchApyFromYupana$('USDT').pipe(map(val => ({ [slug]: val })));
};

export const fetchTzBtcApy$ = () => {
  const slug = KNOWN_TOKENS_SLUGS.tzBTC;
  return fetchKordFiTzBtcApy$().pipe(map(val => ({ [slug]: val })));
};
