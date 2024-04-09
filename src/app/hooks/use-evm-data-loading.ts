import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { loadEVMDataActions } from 'app/store/evm/actions';
import { useAllEVMBalancesSelector } from 'app/store/evm/balances/selectors';
import { defaultChainIDs } from 'lib/apis/temple/endpoints/evm-data';

export const useEVMDataLoading = (publicKeyHash: string) => {
  const balances = useAllEVMBalancesSelector();
  console.log(balances, 'balances');

  useEffect(() => {
    dispatch(loadEVMDataActions.submit({ publicKeyHash, chainIds: defaultChainIDs }));
  }, [publicKeyHash]);
};
