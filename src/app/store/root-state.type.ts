import type { CombinedState } from '@reduxjs/toolkit';
import type { Reducer } from 'redux';

import type { rootReducer } from './root-state.reducer';

type GetStateType<R> = R extends Reducer<CombinedState<infer S>> ? S : never;

export type RootState = GetStateType<typeof rootReducer>;
