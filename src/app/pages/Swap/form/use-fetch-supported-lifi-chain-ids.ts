import { dispatch } from 'app/store';
import {
  putLifiSupportedChainIdsAction,
  setLifiMetadataLastFetchTimeAction
} from 'app/store/evm/swap-lifi-metadata/actions';
import {
  useLifiEvmMetadataLastFetchTimeSelector,
  useLifiSupportedChainIdsSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { getLifiSupportedChains } from 'lib/apis/temple/endpoints/evm';
import { LIFI_SUPPORTED_CHAIN_IDS_INTERVAL } from 'lib/fixed-times';
import { useTypedSWR } from 'lib/swr';

export const useFetchSupportedLifiChainIds = (): void => {
  const lastFetchTime = useLifiEvmMetadataLastFetchTimeSelector();
  const supportedChainIds = useLifiSupportedChainIdsSelector();

  useTypedSWR<number[], Error>(
    'lifi-supported-chain-ids',
    async (): Promise<number[]> => {
      if (
        supportedChainIds.length > 0 &&
        lastFetchTime !== undefined &&
        Date.now() - lastFetchTime < LIFI_SUPPORTED_CHAIN_IDS_INTERVAL
      ) {
        return supportedChainIds;
      }

      const chainIds = await getLifiSupportedChains();
      dispatch(putLifiSupportedChainIdsAction(chainIds));
      dispatch(setLifiMetadataLastFetchTimeAction(Date.now()));

      return chainIds;
    },
    {
      refreshInterval: LIFI_SUPPORTED_CHAIN_IDS_INTERVAL,
      errorRetryInterval: 5_000,
      onError: error => console.error('Failed to fetch LIFI supported chains:', error)
    }
  );
};
