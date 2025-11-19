import { createAction } from '@reduxjs/toolkit';

import { Route3EvmTokenMetadata } from 'lib/metadata/types';

interface Put3RouteEvmTokensMetadataActionActionPayload {
  chainId: number;
  records: StringRecord<Route3EvmTokenMetadata | undefined>;
}

export const putRoute3EvmTokensMetadataAction = createAction<Put3RouteEvmTokensMetadataActionActionPayload>(
  'evm/swap-3route-evm-metadata/PUT_3ROUTE_EVM_TOKENS_METADATA_ACTION'
);

export const put3RouteEvmTokensMetadataLoadingAction = createAction<{ isLoading?: boolean; error?: any }>(
  'evm/swap-3route-evm-metadata/PUT_3ROUTE_EVM_TOKENS_METADATA_LOADING_ACTION'
);

export const set3RouteEvmMetadataLastFetchTimeAction = createAction<number>(
  '@swap-3route-evm-metadata/set-last-fetch-time'
);
