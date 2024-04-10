import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { loadEVMDataActions } from 'app/store/evm/actions';
import { useAccountEVMTokensSelector, useAllEVMTokensSelector } from 'app/store/evm/assets/selectors';
import { useAllEVMBalancesSelector } from 'app/store/evm/balances/selectors';
import { defaultChainIDs } from 'lib/apis/temple/endpoints/evm-data';

import { useAllEVMTokensMetadataSelector } from '../store/evm/tokens-metadata/selectors';

export const useEVMDataLoading = (publicKeyHash: string) => {
  const balances = useAllEVMBalancesSelector();
  console.log(balances, 'balances');

  const allTokens = useAllEVMTokensSelector();
  console.log(allTokens, 'allTokens');

  const allAccountTokens = useAccountEVMTokensSelector(publicKeyHash);
  console.log(allAccountTokens, 'allAccountTokens');

  const tokensMetadata = useAllEVMTokensMetadataSelector();
  console.log(tokensMetadata, 'tokensMetadata');

  useEffect(() => {
    dispatch(loadEVMDataActions.submit({ publicKeyHash, chainIds: defaultChainIDs }));
  }, [publicKeyHash]);
};
