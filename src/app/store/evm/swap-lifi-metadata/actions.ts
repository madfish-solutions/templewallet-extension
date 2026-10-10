import { createAction } from '@reduxjs/toolkit';

import { LifiEvmTokenMetadata } from 'lib/metadata/types';

import { TokenSlugTokenMetadataRecord } from './state';

interface PutLifiEvmTokensMetadataActionPayload {
  chainId: number;
  records: Record<string, LifiEvmTokenMetadata | undefined>;
}

export interface PutLifiEnabledNetworksCataloguePayload {
  recordsByChainId: Record<number, TokenSlugTokenMetadataRecord>;
  timestamp: number;
}

/** One write for every enabled chain's catalogue, plus the fetch timestamp. */
export const putLifiEnabledNetworksEvmTokensCatalogueAction = createAction<PutLifiEnabledNetworksCataloguePayload>(
  'evm/swap-lifi-metadata/PUT_LIFI_ENABLED_NETWORKS_TOKENS_CATALOGUE'
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
