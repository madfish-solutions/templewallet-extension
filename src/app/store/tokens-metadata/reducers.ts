import { createReducer } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';

import { tokenToSlug } from 'lib/assets';

import { addTokensMetadataAction, loadWhitelistAction } from './actions';
import { tokensMetadataInitialState, TokensMetadataState } from './state';

export const tokensMetadataReducer = createReducer<TokensMetadataState>(tokensMetadataInitialState, builder => {
  builder.addCase(addTokensMetadataAction, (state, { payload: tokensMetadata }) => {
    if (tokensMetadata.every(record => !isDefined(record))) return state;

    const metadataRecord = tokensMetadata.reduce((prevState, tokenMetadata) => {
      const slug = tokenToSlug(tokenMetadata);

      return {
        ...prevState,
        [slug]: {
          ...prevState[slug],
          ...tokenMetadata
        }
      };
    }, state.metadataRecord);

    return {
      ...state,
      metadataRecord
    };
  });

  builder.addCase(loadWhitelistAction.success, (state, { payload: tokensMetadata }) => ({
    ...state,
    metadataRecord: tokensMetadata.reduce(
      (obj, tokenMetadata) => ({
        ...obj,
        [tokenToSlug(tokenMetadata)]: tokenMetadata
      }),
      state.metadataRecord
    )
  }));
});
