import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { loadSingleEvmChainDataActions } from 'app/store/evm/actions';
import { useEvmStoredAssetsRecordSelector } from 'app/store/evm/assets/selectors';
import { useEvmBalancesAtomicRecordSelector } from 'app/store/evm/balances/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/currency/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import type { ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

// TODO: Add 1m re-fetch interval
// Loading list of EVM tokens with all necessary data (balances, metadata, exchange rates)

export const useLoadEvmTokensData = (publicKeyHash: HexString) => {
  const assets = useEvmStoredAssetsRecordSelector();
  console.log(assets, 'assets');

  const balances = useEvmBalancesAtomicRecordSelector();
  console.log(balances, 'balances');

  const tokensMetadata = useEvmTokensMetadataRecordSelector();
  console.log(tokensMetadata, 'tokensMetadata');

  const exchangeRates = useEvmUsdToTokenRatesSelector();
  console.log(exchangeRates, 'exchangeRates');

  useEffect(() => {
    EVM_DEFAULT_NETWORKS.forEach(network =>
      dispatch(loadSingleEvmChainDataActions.submit({ publicKeyHash, chainId: network.chainId as ChainID }))
    );
  }, [publicKeyHash]);
};
