import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { loadEVMDataActions } from 'app/store/evm/actions';
import { useAccountEVMTokensSelector, useAllEVMTokensSelector } from 'app/store/evm/assets/selectors';
import { useAllEvmBalancesSelector } from 'app/store/evm/balances/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/currency/selectors';
import { useAllEvmTokensMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { defaultChainIDs } from 'lib/apis/temple/endpoints/evm-data';

export const useEVMDataLoading = (publicKeyHash: HexString) => {
  const balances = useAllEvmBalancesSelector();
  console.log(balances, 'balances');

  const allTokens = useAllEVMTokensSelector();
  console.log(allTokens, 'allTokens');

  const allAccountTokens = useAccountEVMTokensSelector(publicKeyHash);
  console.log(allAccountTokens, 'allAccountTokens');

  const tokensMetadata = useAllEvmTokensMetadataSelector();
  console.log(tokensMetadata, 'tokensMetadata');

  const exchangeRates = useEvmUsdToTokenRatesSelector();
  console.log(exchangeRates, 'exchangeRates');

  useEffect(() => {
    dispatch(loadEVMDataActions.submit({ publicKeyHash, chainIds: defaultChainIDs }));
  }, [publicKeyHash]);
};
