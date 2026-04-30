import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { coingeckoApi } from 'lib/apis/coingecko';
import { useFiatCurrency } from 'lib/fiat-currency';
import { useTypedSWR } from 'lib/swr';

const COINGECKO_ID_BY_EXOLIX_COIN: Record<string, string | undefined> = {
  BTC: 'bitcoin'
};

export const useExternalCoinPrice = (exolixCoin: string): BigNumber => {
  const { selectedFiatCurrency } = useFiatCurrency();
  const fiatCode = selectedFiatCurrency.apiLabel;
  const coingeckoId = COINGECKO_ID_BY_EXOLIX_COIN[exolixCoin];

  const { data } = useTypedSWR<number>(
    coingeckoId ? ['external-coin-price', coingeckoId, fiatCode] : null,
    () =>
      coingeckoApi
        .get<Record<string, Record<string, number>>>('/simple/price', {
          params: { ids: coingeckoId, vs_currencies: fiatCode }
        })
        .then(r => r.data[coingeckoId!]?.[fiatCode] ?? 0),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  return useMemo(() => new BigNumber(data ?? 0), [data]);
};
