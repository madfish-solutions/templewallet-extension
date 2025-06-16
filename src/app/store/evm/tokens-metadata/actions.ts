import { createAction } from '@reduxjs/toolkit';

import { EvmTokenMetadata } from 'lib/metadata/types';

import { BalancesResponse } from '../types';

interface processLoadedEvmTokensMetadataActionPayload {
  chainId: number;
  data: BalancesResponse;
}

export const processLoadedEvmTokensMetadataAction = createAction<processLoadedEvmTokensMetadataActionPayload>(
  'evm/tokens-metadata/PROCESS_LOADED_TOKENS_METADATA_ACTION'
);

interface putEvmTokensMetadataActionActionPayload {
  chainId: number;
  records: Record<string, EvmTokenMetadata | undefined>;
}

export const putEvmTokensMetadataAction = createAction<putEvmTokensMetadataActionActionPayload>(
  'evm/tokens-metadata/PUT_TOKENS_METADATA_ACTION'
);
