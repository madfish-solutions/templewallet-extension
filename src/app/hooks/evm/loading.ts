import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { loadSingleEvmChainCollectiblesActions, loadSingleEvmChainTokensActions } from 'app/store/evm/actions';
import { useEvmStoredCollectiblesRecordSelector } from 'app/store/evm/collectibles/selectors';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmTokensLoadingStateRecordSelector } from 'app/store/evm/selectors';
import { useEvmStoredTokensRecordSelector } from 'app/store/evm/tokens/selectors';
import { useEvmTokensBalancesAtomicRecordSelector } from 'app/store/evm/tokens-balances/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import type { ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

export const useEvmTokensDataLoadingState = (chainId: number) => {
  const loadingStateRecord = useEvmTokensLoadingStateRecordSelector();

  return loadingStateRecord[chainId] ? loadingStateRecord[chainId].isLoading : false;
};

// TODO: Add 1m re-fetch interval
// Loading list of EVM tokens with all necessary data (balances, metadata, exchange rates)
export const useLoadEvmTokensData = (publicKeyHash: HexString) => {
  const tokens = useEvmStoredTokensRecordSelector();
  console.log(tokens, 'tokens');

  const tokensBalances = useEvmTokensBalancesAtomicRecordSelector();
  console.log(tokensBalances, 'tokensBalances');

  const tokensMetadata = useEvmTokensMetadataRecordSelector();
  console.log(tokensMetadata, 'tokensMetadata');

  const exchangeRates = useEvmUsdToTokenRatesSelector();
  console.log(exchangeRates, 'exchangeRates');

  const collectibles = useEvmStoredCollectiblesRecordSelector();
  console.log(collectibles, 'collectibles');

  const collectiblesMetadata = useEvmCollectiblesMetadataRecordSelector();
  console.log(collectiblesMetadata, 'collectiblesMetadata');

  useEffect(() => {
    EVM_DEFAULT_NETWORKS.forEach(network => {
      const chainId = network.chainId as ChainID;

      dispatch(loadSingleEvmChainTokensActions.submit({ publicKeyHash, chainId }));
      dispatch(loadSingleEvmChainCollectiblesActions.submit({ publicKeyHash, chainId }));
    });
  }, [publicKeyHash]);
};
