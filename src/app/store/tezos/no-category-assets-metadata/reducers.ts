import { Draft, createReducer } from '@reduxjs/toolkit';
import { omit, pick } from 'lodash';

import { fromAssetSlug } from 'lib/assets';
import { FetchedMetadataRecord } from 'lib/metadata/fetch';
import { buildTokenMetadataFromFetched } from 'lib/metadata/utils';

import { putCollectiblesMetadataAction } from '../collectibles-metadata/actions';
import { putTokensMetadataAction } from '../tokens-metadata/actions';

import {
  putNoCategoryAssetsMetadataAction,
  loadNoCategoryAssetsMetadataAction,
  setNoCategoryAssetsMetadataLoadingAction,
  refreshNoCategoryAssetsMetadataActions
} from './actions';
import { noCategoryAssetsMetadataInitialState, NoCategoryAssetsMetadataState } from './state';

export const noCategoryAssetsMetadataReducer = createReducer<NoCategoryAssetsMetadataState>(
  noCategoryAssetsMetadataInitialState,
  builder => {
    builder.addCase(
      putNoCategoryAssetsMetadataAction,
      (state, { payload: { records, associatedAccountPkh, chainId, resetLoading } }) => {
        for (const slug of Object.keys(records)) {
          const [address, id] = fromAssetSlug(slug);
          const rawMetadata = records[slug];
          if (!rawMetadata || !id) continue;

          state.metadataRecord[slug] = buildTokenMetadataFromFetched(rawMetadata, address, id);
          state.contractsChainIds[address] = chainId;
          if (!state.accountToAssetAssociations[associatedAccountPkh]) {
            state.accountToAssetAssociations[associatedAccountPkh] = [];
          }
          state.accountToAssetAssociations[associatedAccountPkh].push(slug);
        }

        if (resetLoading) state.metadataLoading = false;
      }
    );

    builder.addCase(loadNoCategoryAssetsMetadataAction, state => {
      state.metadataLoading = true;
    });

    builder.addCase(setNoCategoryAssetsMetadataLoadingAction, (state, { payload }) => {
      state.metadataLoading = payload;
    });

    builder.addCase(refreshNoCategoryAssetsMetadataActions.success, (state, { payload }) => {
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

    const handlePutTokensOrCollectibles = (
      state: Draft<NoCategoryAssetsMetadataState>,
      { payload: { records } }: { payload: { records: FetchedMetadataRecord } }
    ) => {
      for (const slug of Object.keys(records)) {
        delete state.metadataRecord[slug];
      }
    };

    builder.addCase(putTokensMetadataAction, handlePutTokensOrCollectibles);
    builder.addCase(putCollectiblesMetadataAction, handlePutTokensOrCollectibles);
  }
);
