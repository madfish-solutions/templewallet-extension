import { createAction } from '@reduxjs/toolkit';

import type { WhitelistResponseToken } from 'lib/apis/temple';
import type { FetchedMetadataRecord } from 'lib/metadata/fetch';

export const putTokensMetadataAction = createAction<{
  records: FetchedMetadataRecord;
  resetLoading?: boolean;
}>('tokens-metadata/PUT_MULTIPLE');

export const addWhitelistTokensMetadataAction = createAction<WhitelistResponseToken[]>(
  'tokens-metadata/ADD_WHITELISTED'
);

export const loadTokensMetadataAction = createAction<{
  rpcUrl: string;
  slugs: string[];
}>('tokens-metadata/LOAD');

export const resetTokensMetadataLoadingAction = createAction('tokens-metadata/RESET_LOADING');

export const refreshTokensMetadataAction = createAction<FetchedMetadataRecord>('tokens-metadata/REFRESH_MULTIPLE');
