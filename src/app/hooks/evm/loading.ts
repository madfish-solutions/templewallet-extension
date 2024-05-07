import { useEffect } from 'react';

import { dispatch } from 'app/store';
import {
  loadEvmCollectiblesMetadataActions,
  loadEvmBalancesActions,
  loadEvmTokensMetadataActions
} from 'app/store/evm/actions';
import {
  useEvmStoredCollectiblesRecordSelector,
  useEvmStoredTokensRecordSelector
} from 'app/store/evm/assets/selectors';
import { useEvmBalancesAtomicRecordSelector } from 'app/store/evm/balances/selectors';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import {
  useEvmBalancesLoadingStateRecordSelector,
  useEvmCollectiblesMetadataLoadingStateRecordSelector
} from 'app/store/evm/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import type { ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

// TODO: Add 1m re-fetch interval
// Loading list of EVM tokens with all necessary data (balances, metadata, exchange rates)
export const useLoadEvmTokensData = (publicKeyHash: HexString) => {
  const tokens = useEvmStoredTokensRecordSelector();
  console.log(tokens, 'tokens');

  const collectibles = useEvmStoredCollectiblesRecordSelector();
  console.log(collectibles, 'collectibles');

  const balances = useEvmBalancesAtomicRecordSelector();
  console.log(balances, 'balances');

  const exchangeRates = useEvmUsdToTokenRatesSelector();
  console.log(exchangeRates, 'exchangeRates');

  const tokensMetadata = useEvmTokensMetadataRecordSelector();
  console.log(tokensMetadata, 'tokensMetadata');

  const collectiblesMetadata = useEvmCollectiblesMetadataRecordSelector();
  console.log(collectiblesMetadata, 'collectiblesMetadata');

  useEffect(() => {
    EVM_DEFAULT_NETWORKS.forEach(network => {
      const chainId = network.chainId as ChainID;

      dispatch(loadEvmBalancesActions.submit({ publicKeyHash, chainId }));
      dispatch(loadEvmTokensMetadataActions.submit({ publicKeyHash, chainId }));
      dispatch(loadEvmCollectiblesMetadataActions.submit({ publicKeyHash, chainId }));
    });
  }, [publicKeyHash]);
};

export const useEvmBalancesLoadingState = (chainId: number) => {
  const loadingStateRecord = useEvmBalancesLoadingStateRecordSelector();

  return loadingStateRecord[chainId] ? loadingStateRecord[chainId].isLoading : false;
};

export const useEvmCollectiblesMetadataLoadingState = (chainId: number) => {
  const loadingStateRecord = useEvmCollectiblesMetadataLoadingStateRecordSelector();

  return loadingStateRecord[chainId] ? loadingStateRecord[chainId].isLoading : false;
};
