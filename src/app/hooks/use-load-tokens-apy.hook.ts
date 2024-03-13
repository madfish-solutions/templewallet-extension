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
import { TempleChainId } from 'lib/temple/types';
import { useTezosNetwork } from 'temple/front';

export const useTokensApyLoading = () => {
  const { rpcUrl, chainId } = useTezosNetwork();
  const usdToTokenRates = useUsdToTokenRatesSelector();

  const [tokensApy, setTokensApy] = useState({});

  useEffect(() => {
    if (chainId === TempleChainId.Mainnet) {
      const subscription = forkJoin([
        fetchTzBtcApy$(),
        fetchKUSDApy$(),
        fetchUSDTApy$(),
        fetchUUSDCApr$(rpcUrl),
        fetchUBTCApr$(rpcUrl),
        fetchYOUApr$(rpcUrl, usdToTokenRates)
      ]).subscribe(responses => {
        setTokensApy(Object.assign({}, ...responses));
      });

      return () => subscription.unsubscribe();
    }

    return;
  }, [usdToTokenRates, chainId, rpcUrl]);

  useEffect(() => {
    dispatch(loadTokensApyActions.success(tokensApy));
  }, [tokensApy]);
};
