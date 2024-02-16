import { createReducer } from '@reduxjs/toolkit';
import { omit, pick } from 'lodash';

import { toTokenSlug, fromAssetSlug } from 'lib/assets';
import { buildTokenMetadataFromFetched, buildTokenMetadataFromWhitelist } from 'lib/metadata/utils';

import {
  putTokensMetadataAction,
  addWhitelistTokensMetadataAction,
  loadTokensMetadataAction,
  resetTokensMetadataLoadingAction,
  refreshTokensMetadataAction
} from './actions';
import { tokensMetadataInitialState, TokensMetadataState } from './state';

export const tokensMetadataReducer = createReducer<TokensMetadataState>(tokensMetadataInitialState, builder => {
  builder.addCase(putTokensMetadataAction, (state, { payload: { records, resetLoading } }) => {
    for (const slug of Object.keys(records)) {
      const [address, id] = fromAssetSlug(slug);
      const rawMetadata = records[slug];
      if (!rawMetadata || !id) continue;

      state.metadataRecord[slug] = buildTokenMetadataFromFetched(rawMetadata, address, id);
    }

    if (resetLoading) state.metadataLoading = false;
  });

  builder.addCase(addWhitelistTokensMetadataAction, (state, { payload }) => {
    for (const rawMetadata of payload) {
      const slug = toTokenSlug(rawMetadata.contractAddress, rawMetadata.fa2TokenId);
      if (state.metadataRecord[slug]) continue;

      state.metadataRecord[slug] = buildTokenMetadataFromWhitelist(rawMetadata);
    }
  });

  builder.addCase(loadTokensMetadataAction, state => {
    state.metadataLoading = true;
  });

  builder.addCase(resetTokensMetadataLoadingAction, state => {
    state.metadataLoading = false;
  });

  builder.addCase(refreshTokensMetadataAction, (state, { payload }) => {
    const keysToRefresh = ['artifactUri', 'displayUri'] as const;

    for (const slug of Object.keys(payload)) {
      const current = state.metadataRecord[slug];
      if (!current) continue;

      const [address, id] = fromAssetSlug(slug);
      const rawMetadata = payload[slug];
      if (!rawMetadata || !id) continue;

      const metadata = buildTokenMetadataFromFetched(rawMetadata, address, id);

      state.metadataRecord[slug] = {
        ...omit(current, keysToRefresh),
        ...pick(metadata, keysToRefresh)
      };
    }
  });
});
