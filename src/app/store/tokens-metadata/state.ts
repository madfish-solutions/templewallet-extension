import { tokenToSlug } from 'lib/assets';
import { LOCAL_MAINNET_TOKENS_METADATA, DCP_TOKENS_METADATA } from 'lib/assets/known-tokens';
import type { TokenMetadata } from 'lib/metadata';

export type MetadataRecords = Record<string, TokenMetadata>;

export interface TokensMetadataState {
  metadataRecord: MetadataRecords;
  metadataLoading: boolean;
}

export const tokensMetadataInitialState: TokensMetadataState = {
  metadataRecord: [...LOCAL_MAINNET_TOKENS_METADATA, ...DCP_TOKENS_METADATA].reduce(
    (obj, tokenMetadata) => ({
      ...obj,
      [tokenToSlug(tokenMetadata)]: tokenMetadata
    }),
    {}
  ),
  metadataLoading: false
};
