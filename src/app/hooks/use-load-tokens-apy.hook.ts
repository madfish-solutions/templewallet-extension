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
import { TempleTezosChainId } from 'lib/temple/types';
import { useTezosNetwork } from 'temple/front';

export const useTokensApyLoading = () => {
  const { rpcUrl, chainId } = useTezosNetwork();
  const usdToTokenRates = useUsdToTokenRatesSelector();

  const [tokensApy, setTokensApy] = useState({});

  useEffect(() => {
    if (chainId === TempleTezosChainId.Mainnet) {
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
