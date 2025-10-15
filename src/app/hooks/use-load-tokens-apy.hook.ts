import { useEffect, useState } from 'react';

import { forkJoin } from 'rxjs';

import { dispatch } from 'app/store';
import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { loadTokensApyActions } from 'app/store/d-apps/actions';
import {
  fetchKUSDApy$,
  fetchTzBtcApy$,
  fetchUBTCApr$,
  fetchUSDTApy$,
  fetchUUSDCApr$,
  fetchYOUApr$
} from 'app/store/d-apps/utils';
import { useTezosMainnetChain } from 'temple/front';

export const useTokensApyLoading = () => {
  const chain = useTezosMainnetChain();
  const usdToTokenRates = useTezosUsdToTokenRatesSelector();

  const [tokensApy, setTokensApy] = useState({});

  useEffect(() => {
    const subscription = forkJoin([
      fetchTzBtcApy$(),
      fetchKUSDApy$(),
      fetchUSDTApy$(),
      fetchUUSDCApr$(chain),
      fetchUBTCApr$(chain),
      fetchYOUApr$(chain, usdToTokenRates)
    ]).subscribe(responses => {
      setTokensApy(Object.assign({}, ...responses));
    });

    return () => subscription.unsubscribe();
  }, [usdToTokenRates, chain]);

  useEffect(() => {
    dispatch(loadTokensApyActions.success(tokensApy));
  }, [tokensApy]);
};
