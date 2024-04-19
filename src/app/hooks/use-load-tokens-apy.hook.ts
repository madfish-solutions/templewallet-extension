import { useEffect, useState } from 'react';

import { forkJoin } from 'rxjs';

import { dispatch } from 'app/store';
import { loadTokensApyActions } from 'app/store/d-apps/actions';
import {
  fetchKUSDApy$,
  fetchTzBtcApy$,
  fetchUBTCApr$,
  fetchUSDTApy$,
  fetchUUSDCApr$,
  fetchYOUApr$
} from 'app/store/d-apps/utils';
import { useUsdToTokenRatesSelector } from 'app/store/tezos/currency/selectors';
import { useTezosMainnetChain } from 'temple/front';

export const useTokensApyLoading = () => {
  const { rpcBaseURL } = useTezosMainnetChain();
  const usdToTokenRates = useUsdToTokenRatesSelector();

  const [tokensApy, setTokensApy] = useState({});

  useEffect(() => {
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
  }, [usdToTokenRates, rpcBaseURL]);

  useEffect(() => {
    dispatch(loadTokensApyActions.success(tokensApy));
  }, [tokensApy]);
};
