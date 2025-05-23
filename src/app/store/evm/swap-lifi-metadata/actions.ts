import { createAction } from '@reduxjs/toolkit';

import { LifiEvmTokenMetadata } from 'lib/metadata/types';

interface putLifiEvmTokensMetadataActionActionPayload {
  chainId: number;
  records: Record<string, LifiEvmTokenMetadata | undefined>;
}

export const putLifiEvmTokensMetadataAction = createAction<putLifiEvmTokensMetadataActionActionPayload>(
  'evm/swap-lifi-metadata/PUT_LIFI_TOKENS_METADATA_ACTION'
);

export const putLifiEvmTokensMetadataLoadingAction = createAction<{ isLoading?: boolean; error?: any }>(
  'evm/swap-lifi-metadata/PUT_LIFI_TOKENS_METADATA_LOADING_ACTION'
);
