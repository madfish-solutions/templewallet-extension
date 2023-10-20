import { useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';
import { forkJoin } from 'rxjs';

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
import { useChainId, useTezos } from 'lib/temple/front';
import { TempleChainId } from 'lib/temple/types';

export const useTokensApyLoading = () => {
  const dispatch = useDispatch();
  const tezos = useTezos();
  const chainId = useChainId(true)!;
  const usdToTokenRates = useUsdToTokenRatesSelector();

  const [tokensApy, setTokensApy] = useState({});

  useEffect(() => {
    if (chainId === TempleChainId.Mainnet) {
      const subscription = forkJoin([
        fetchTzBtcApy$(),
        fetchKUSDApy$(),
        fetchUSDTApy$(),
        fetchUUSDCApr$(tezos),
        fetchUBTCApr$(tezos),
        fetchYOUApr$(tezos, usdToTokenRates)
      ]).subscribe(responses => {
        setTokensApy(Object.assign({}, ...responses));
      });

      return () => subscription.unsubscribe();
    }

    return;
  }, [chainId, usdToTokenRates, tezos]);

  useEffect(() => {
    dispatch(loadTokensApyActions.success(tokensApy));
  }, [tokensApy]);
};
