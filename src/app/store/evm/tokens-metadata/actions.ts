import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmTokenMetadata } from 'lib/metadata/types';

interface processLoadedEvmTokensMetadataActionPayload {
  chainId: number;
  data: BalancesResponse;
}

export const processLoadedEvmTokensMetadataAction = createAction<processLoadedEvmTokensMetadataActionPayload>(
  'evm/PROCESS_LOADED_TOKENS_METADATA_ACTION'
);

interface putEvmTokensMetadataActionActionPayload {
  chainId: number;
  records: Record<string, EvmTokenMetadata | undefined>;
}

export const putEvmTokensMetadataAction = createAction<putEvmTokensMetadataActionActionPayload>(
  'evm/PUT_TOKENS_METADATA_ACTION'
);
