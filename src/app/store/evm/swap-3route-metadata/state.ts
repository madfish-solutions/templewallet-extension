import { Route3EvmTokenMetadata } from 'lib/metadata/types';
import { ETHERLINK_MAINNET_CHAIN_ID } from 'lib/temple/types';

type TokenSlugTokenMetadataRecord = StringRecord<Route3EvmTokenMetadata>;

export type Route3EvmTokenMetadataRecord = Record<number, TokenSlugTokenMetadataRecord>;

export interface Route3EvmTokensMetadataState {
  metadataRecord: Route3EvmTokenMetadataRecord;
  supportedChainIds: number[];
  lastFetchTime?: number;
  isLoading: boolean;
  error: any;
}

export const route3EvmTokensMetadataInitialState: Route3EvmTokensMetadataState = {
  metadataRecord: {},
  supportedChainIds: [ETHERLINK_MAINNET_CHAIN_ID],
  lastFetchTime: undefined,
  isLoading: false,
  error: null
};
