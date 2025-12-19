import { useEffect, useState } from 'react';

import { transform } from 'lodash';
import { from } from 'rxjs';

import { dispatch } from 'app/store';
import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { loadTokensApyActions } from 'app/store/d-apps/actions';
import { YouvesStatsResponse, getYouvesStats } from 'lib/apis/temple/endpoints/get-youves-stats';
import { useTezosMainnetChain } from 'temple/front';

export const useTokensApyLoading = () => {
  const chain = useTezosMainnetChain();
  const usdToTokenRates = useTezosUsdToTokenRatesSelector();

  const [tokensApy, setTokensApy] = useState({});

  useEffect(() => {
    const subscription = from(getYouvesStats()).subscribe(({ apr: youvesAprs }) => {
      setTokensApy(
        transform<YouvesStatsResponse['apr'], StringRecord<number>>(
          youvesAprs,
          (acc, curr, key) => {
            acc[key] = typeof curr === 'number' ? curr : curr.v3;

            return acc;
          },
          {}
        )
      );
    });

    return () => subscription.unsubscribe();
  }, [usdToTokenRates, chain]);

  useEffect(() => {
    dispatch(loadTokensApyActions.success(tokensApy));
  }, [tokensApy]);
};
