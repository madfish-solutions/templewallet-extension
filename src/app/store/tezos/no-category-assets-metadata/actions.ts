import { createAction } from '@reduxjs/toolkit';

import type { FetchedMetadataRecord } from 'lib/metadata/fetch';
import { createActions } from 'lib/store';

export const putNoCategoryAssetsMetadataAction = createAction<{
  records: FetchedMetadataRecord;
  associatedAccountPkh: string;
  chainId: string;
  resetLoading?: boolean;
}>('no-category-assets-metadata/PUT_MULTIPLE');

export const loadNoCategoryAssetsMetadataAction = createAction<{
  associatedAccountPkh: string;
  rpcUrl: string;
  chainId: string;
  slugs: string[];
}>('no-category-assets-metadata/LOAD');

export const setNoCategoryAssetsMetadataLoadingAction = createAction<boolean>(
  'no-category-assets-metadata/SET_LOADING'
);

export const refreshNoCategoryAssetsMetadataActions = createActions<
  { associatedAccountPkh: string; rpcUrls: StringRecord },
  FetchedMetadataRecord
>('no-category-assets-metadata/REFRESH_MULTIPLE');
