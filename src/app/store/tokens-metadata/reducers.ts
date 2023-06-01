import { createReducer } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';

import { tokenToSlug } from 'lib/assets';

import {
  addTokensMetadataAction,
  loadWhitelistAction,
  loadTokensMetadataAction,
  loadTokenMetadataActions,
  resetTokenMetadataLoadingAction
} from './actions';
import { tokensMetadataInitialState, TokensMetadataState } from './state';

export const tokensMetadataReducer = createReducer<TokensMetadataState>(tokensMetadataInitialState, builder => {
  builder.addCase(addTokensMetadataAction, (state, { payload: tokensMetadata }) => {
    if (tokensMetadata.every(record => !isDefined(record))) {
      return {
        ...state,
        metadataLoading: false
      };
    }

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
      metadataRecord,
      metadataLoading: false
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

  builder.addCase(loadTokensMetadataAction, state => ({
    ...state,
    metadataLoading: true
  }));

  builder.addCase(resetTokenMetadataLoadingAction, state => ({
    ...state,
    metadataLoading: false
  }));

  builder.addCase(loadTokenMetadataActions.fail, state => ({
    ...state,
    metadataLoading: false
  }));
});
