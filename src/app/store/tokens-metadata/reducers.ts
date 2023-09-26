import { createReducer } from '@reduxjs/toolkit';
import { omit, pick } from 'lodash';

import { tokenToSlug } from 'lib/assets';
import { buildTokenMetadataFromFetched, buildTokenMetadataFromTzkt } from 'lib/metadata/utils';

import {
  putTokensMetadataAction,
  loadTokensMetadataAction,
  resetTokensMetadataLoadingAction,
  refreshTokensMetadataAction,
  addTokensMetadataAction,
  addTokensMetadataOfFetchedAction,
  addTokensMetadataOfTzktAction
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

  builder.addCase(addTokensMetadataAction, (state, { payload }) => {
    for (const metadata of payload) {
      const slug = tokenToSlug(metadata);
      if (state.metadataRecord[slug]) continue;

      state.metadataRecord[slug] = metadata;
    }
  });

  builder.addCase(addTokensMetadataOfFetchedAction, (state, { payload }) => {
    for (const slug of Object.keys(payload)) {
      if (state.metadataRecord[slug]) continue;

      const [address, id] = slug.split('_');
      state.metadataRecord[slug] = buildTokenMetadataFromFetched(payload[slug]!, address, Number(id));
    }
  });

  builder.addCase(addTokensMetadataOfTzktAction, (state, { payload }) => {
    for (const slug of Object.keys(payload)) {
      if (state.metadataRecord[slug]) continue;

      const asset = payload[slug]!;
      state.metadataRecord[slug] = buildTokenMetadataFromTzkt(
        asset.metadata,
        asset.contract.address,
        Number(asset.tokenId)
      );
    }
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
