// import { LoadableEntityState, createEntity } from 'lib/store';
import { LOCAL_MAINNET_TOKENS_METADATA, DCP_TOKENS_METADATA, tokenToSlug } from 'lib/assets';
import { TokenMetadata } from 'lib/metadata';

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
