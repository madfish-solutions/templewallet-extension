import { createReducer } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';
import { omit, pick } from 'lodash';

import { tokenToSlug } from 'lib/assets';

import {
  putTokensMetadataAction,
  loadTokensMetadataAction,
  resetTokensMetadataLoadingAction,
  refreshTokensMetadataAction,
  addTokensMetadataAction
} from './actions';
import { tokensMetadataInitialState, TokensMetadataState } from './state';

export const tokensMetadataReducer = createReducer<TokensMetadataState>(tokensMetadataInitialState, builder => {
  builder.addCase(putTokensMetadataAction, (state, { payload: tokensMetadata }) => {
    if (tokensMetadata.length < 1) {
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

  builder.addCase(addTokensMetadataAction, (state, { payload: tokensMetadata }) => {
    tokensMetadata = tokensMetadata.filter(metadata => {
      const slug = tokenToSlug(metadata);

      return !isDefined(state.metadataRecord[slug]);
    });

    if (tokensMetadata.length < 1) return state;

    return {
      ...state,
      metadataRecord: tokensMetadata.reduce(
        (obj, tokenMetadata) => ({
          ...obj,
          [tokenToSlug(tokenMetadata)]: tokenMetadata
        }),
        state.metadataRecord
      )
    };
  });

  builder.addCase(loadTokensMetadataAction, state => ({
    ...state,
    metadataLoading: true
  }));

  builder.addCase(resetTokensMetadataLoadingAction, state => ({
    ...state,
    metadataLoading: false
  }));

  builder.addCase(refreshTokensMetadataAction, (state, { payload }) => {
    const keysToRefresh = ['artifactUri', 'displayUri'] as const;

    for (const metadata of payload) {
      const slug = tokenToSlug(metadata);
      const current = state.metadataRecord[slug];
      if (!current) continue;

      state.metadataRecord[slug] = {
        ...omit(current, keysToRefresh),
        ...pick(metadata, keysToRefresh)
      };
    }
  });
});
