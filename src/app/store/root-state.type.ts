import type { CombinedState } from '@reduxjs/toolkit';
import type { Reducer } from 'redux';

import { TokenMetadataV1 } from 'lib/metadata/types';

import type { rootReducer } from './root-state.reducer';

type GetStateType<R> = R extends Reducer<CombinedState<infer S>> ? S : never;

export type RootState = GetStateType<typeof rootReducer>;

export type RootStateV1 = RootState & {
  tokensMetadata: {
    metadataRecord: TokenMetadataV1;
  };
};
