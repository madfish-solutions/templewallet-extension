import { map } from 'rxjs';

import { fetchApyFromYupana$ } from 'lib/apis/yupana';
import { KNOWN_TOKENS_SLUGS } from 'lib/temple/assets';

export const YUPANA_LEND_LINK = 'https://app.yupana.finance/lending';

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
  return fetchApyFromYupana$('TZBTC').pipe(map(val => ({ [slug]: val })));
};
