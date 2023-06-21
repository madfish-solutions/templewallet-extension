import { useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';
import { forkJoin } from 'rxjs';

import { useTezos } from '../../lib/temple/front';
import { useUsdToTokenRatesSelector } from '../store/currency/selectors';
import { loadTokensApyActions } from '../store/d-apps/actions';
import {
  fetchKUSDApy$,
  fetchTzBtcApy$,
  fetchUBTCApr$,
  fetchUSDTApy$,
  fetchUUSDCApr$,
  fetchYOUApr$
} from '../store/d-apps/utils';

export const useLoadTokensApy = () => {
  const dispatch = useDispatch();
  const tezos = useTezos();
  const usdToTokenRates = useUsdToTokenRatesSelector();

  const [tokensApy, setTokensApy] = useState({});

  useEffect(() => {
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
  }, [usdToTokenRates]);

  useEffect(() => {
    dispatch(loadTokensApyActions.success(tokensApy));
  }, [tokensApy]);
};
