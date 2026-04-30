import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  addCrossChainExchangeAction,
  dismissCrossChainBannerAction,
  removeCrossChainExchangeAction,
  updateCrossChainExchangeAction
} from './actions';
import { crossChainSendInitialState, CrossChainSendState } from './state';

export const crossChainSendReducer = createReducer<CrossChainSendState>(crossChainSendInitialState, builder => {
  builder.addCase(addCrossChainExchangeAction, (state, { payload }) => {
    state.byId[payload.id] = payload;
    if (!state.ids.includes(payload.id)) state.ids.unshift(payload.id);
  });

  builder.addCase(updateCrossChainExchangeAction, (state, { payload }) => {
    const existing = state.byId[payload.id];
    if (!existing) return;
    if (payload.phase) existing.phase = payload.phase;
    if (payload.exolixStatus !== undefined) existing.exolixStatus = payload.exolixStatus;
    if (payload.hashIn) existing.hashIn = payload.hashIn;
    if (payload.hashOut) existing.hashOut = payload.hashOut;
    if (payload.refundHash) existing.refundHash = payload.refundHash;
    if (payload.toAmountActual !== undefined) existing.toAmountActual = payload.toAmountActual;
    if (payload.completedAt) existing.completedAt = payload.completedAt;
    existing.updatedAt = payload.updatedAt;
    state.lastCheckedAt = payload.updatedAt;
  });

  builder.addCase(removeCrossChainExchangeAction, (state, { payload: id }) => {
    delete state.byId[id];
    state.ids = state.ids.filter(x => x !== id);
  });

  builder.addCase(dismissCrossChainBannerAction, (state, { payload: id }) => {
    const existing = state.byId[id];
    if (!existing) return;
    existing.bannerDismissed = true;
  });
});

export const crossChainSendPersistedReducer = persistReducer(
  {
    key: 'root.crossChainSend',
    ...storageConfig
  },
  crossChainSendReducer
);
