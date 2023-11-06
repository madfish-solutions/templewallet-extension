import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
// import { omit, pick } from 'lodash';

// import { tokenToSlug } from 'lib/assets';
// import { buildTokenMetadataFromFetched } from 'lib/metadata/utils';

// import {
//   putTokensMetadataAction,
//   loadTokensMetadataAction,
//   resetTokensMetadataLoadingAction,
//   refreshTokensMetadataAction,
//   addTokensMetadataAction,
//   addTokensMetadataOfFetchedAction
// } from './actions';
import { collectiblesMetadataInitialState, CollectiblesMetadataState } from './state';

const collectiblesMetadataReducer = createReducer(collectiblesMetadataInitialState, builder => {
  // builder.addCase(putTokensMetadataAction, (state, { payload: tokensMetadata }) => {
  //   if (tokensMetadata.length < 1) {
  //     return {
  //       ...state,
  //       metadataLoading: false
  //     };
  //   }
  //   const metadataRecord = tokensMetadata.reduce((prevState, tokenMetadata) => {
  //     const slug = tokenToSlug(tokenMetadata);
  //     return {
  //       ...prevState,
  //       [slug]: {
  //         ...prevState[slug],
  //         ...tokenMetadata
  //       }
  //     };
  //   }, state.metadataRecord);
  //   return {
  //     ...state,
  //     metadataRecord,
  //     metadataLoading: false
  //   };
  // });
  // builder.addCase(addTokensMetadataAction, (state, { payload }) => {
  //   for (const metadata of payload) {
  //     const slug = tokenToSlug(metadata);
  //     if (state.metadataRecord[slug]) continue;
  //     state.metadataRecord[slug] = metadata;
  //   }
  // });
  // builder.addCase(addTokensMetadataOfFetchedAction, (state, { payload }) => {
  //   for (const slug of Object.keys(payload)) {
  //     if (state.metadataRecord[slug]) continue;
  //     const [address, id] = slug.split('_');
  //     state.metadataRecord[slug] = buildTokenMetadataFromFetched(payload[slug]!, address, Number(id));
  //   }
  // });
  // builder.addCase(loadTokensMetadataAction, state => ({
  //   ...state,
  //   metadataLoading: true
  // }));
  // builder.addCase(resetTokensMetadataLoadingAction, state => ({
  //   ...state,
  //   metadataLoading: false
  // }));
  // builder.addCase(refreshTokensMetadataAction, (state, { payload }) => {
  //   const keysToRefresh = ['artifactUri', 'displayUri'] as const;
  //   for (const metadata of payload) {
  //     const slug = tokenToSlug(metadata);
  //     const current = state.metadataRecord[slug];
  //     if (!current) continue;
  //     state.metadataRecord[slug] = {
  //       ...omit(current, keysToRefresh),
  //       ...pick(metadata, keysToRefresh)
  //     };
  //   }
  // });
});

export const collectiblesMetadataPersistedReducer = persistReducer(
  {
    key: 'root.collectibles-metadata',
    storage
  },
  collectiblesMetadataReducer
);
