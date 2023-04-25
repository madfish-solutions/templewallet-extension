// import { LoadableEntityState, createEntity } from 'lib/store';
import { DCP_TOKENS_METADATA, LOCAL_MAINNET_TOKENS_METADATA, tokenToSlug } from 'lib/temple/assets';

import { TokenMetadataInterface } from './utils';

export interface TokensMetadataState {
  metadataRecord: Record<string, TokenMetadataInterface>;
  // addTokenSuggestion: LoadableEntityState<TokenMetadataInterface>;
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
