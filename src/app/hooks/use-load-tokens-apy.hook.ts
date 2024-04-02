import { useEffect, useState } from 'react';

import { forkJoin } from 'rxjs';

import { dispatch } from 'app/store';
import { useUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { loadTokensApyActions } from 'app/store/d-apps/actions';
import {
  fetchKUSDApy$,
  fetchTzBtcApy$,
  fetchUBTCApr$,
  fetchUSDTApy$,
  fetchUUSDCApr$,
  fetchYOUApr$
} from 'app/store/d-apps/utils';
import { useTezosNetwork } from 'temple/front';

export const useTokensApyLoading = () => {
  const { rpcBaseURL, isMainnet } = useTezosNetwork();
  const usdToTokenRates = useUsdToTokenRatesSelector();

  const [tokensApy, setTokensApy] = useState({});

  useEffect(() => {
    if (isMainnet === false) return;

    const subscription = forkJoin([
      fetchTzBtcApy$(),
      fetchKUSDApy$(),
      fetchUSDTApy$(),
      fetchUUSDCApr$(rpcBaseURL),
      fetchUBTCApr$(rpcBaseURL),
      fetchYOUApr$(rpcBaseURL, usdToTokenRates)
    ]).subscribe(responses => {
      setTokensApy(Object.assign({}, ...responses));
    });

    return () => subscription.unsubscribe();
  }, [usdToTokenRates, isMainnet, rpcBaseURL]);

  useEffect(() => {
    dispatch(loadTokensApyActions.success(tokensApy));
  }, [tokensApy]);
};
