// import { LoadableEntityState, createEntity } from 'lib/store';
import { tokenToSlug } from 'lib/assets';
import { TokenMetadata } from 'lib/metadata';
import { DCP_TOKENS_METADATA, LOCAL_MAINNET_TOKENS_METADATA } from 'lib/temple/assets';

export interface TokensMetadataState {
  metadataRecord: Record<string, TokenMetadata>;
  // addTokenSuggestion: LoadableEntityState<TokenMetadata>;
}

export const tokensMetadataInitialState: TokensMetadataState = {
  metadataRecord: [...LOCAL_MAINNET_TOKENS_METADATA, ...DCP_TOKENS_METADATA].reduce(
    (obj, tokenMetadata) => ({
      ...obj,
      [tokenToSlug(tokenMetadata)]: tokenMetadata
    }),
    {}
  )
  // addTokenSuggestion: createEntity(emptyTokenMetadata)
};
