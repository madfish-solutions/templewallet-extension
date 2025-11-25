import { createAction } from '@reduxjs/toolkit';

import { LifiEvmTokenMetadata } from 'lib/metadata/types';

interface PutLifiEvmTokensMetadataActionPayload {
  chainId: number;
  records: Record<string, LifiEvmTokenMetadata | undefined>;
}

export const putLifiEnabledNetworksEvmTokensMetadataAction = createAction<PutLifiEvmTokensMetadataActionPayload>(
  'evm/swap-lifi-metadata/PUT_LIFI_ENABLED_NETWORKS_TOKENS_METADATA_ACTION'
);

export const putLifiConnectedEvmTokensMetadataAction = createAction<PutLifiEvmTokensMetadataActionPayload>(
  'evm/swap-lifi-metadata/PUT_LIFI_CONNECTED_TOKENS_METADATA_ACTION'
);

export const putLifiEvmTokensMetadataLoadingAction = createAction<{ isLoading?: boolean; error?: any }>(
  'evm/swap-lifi-metadata/PUT_LIFI_TOKENS_METADATA_LOADING_ACTION'
);

export const putLifiSupportedChainIdsAction = createAction<number[]>(
  'evm/swap-lifi-metadata/PUT_LIFI_SUPPORTED_CHAIN_IDS_ACTION'
);

export const setLifiMetadataLastFetchTimeAction = createAction<number>('@swap-lifi-metadata/set-last-fetch-time');
