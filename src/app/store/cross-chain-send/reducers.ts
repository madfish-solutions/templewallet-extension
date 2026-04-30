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

const isExchangeHash = (value: unknown): value is { hash: string | null; link: string | null } =>
  Boolean(value) && typeof value === 'object';

const isMeaningfulHash = (value: unknown) =>
  isExchangeHash(value) && typeof value.hash === 'string' && value.hash.length > 0;

export const crossChainSendReducer = createReducer<CrossChainSendState>(crossChainSendInitialState, builder => {
  builder.addCase(addCrossChainExchangeAction, (state, { payload }) => {
    const existing = state.byId[payload.id];
    if (existing) {
      state.byId[payload.id] = {
        ...payload,
        phase: existing.phase,
        exolixStatus: existing.exolixStatus ?? payload.exolixStatus,
        sourceTxHash: existing.sourceTxHash ?? payload.sourceTxHash,
        hashIn: isMeaningfulHash(existing.hashIn) ? existing.hashIn : payload.hashIn,
        hashOut: isMeaningfulHash(existing.hashOut) ? existing.hashOut : payload.hashOut,
        refundHash: existing.refundHash ?? payload.refundHash,
        toAmountActual: existing.toAmountActual ?? payload.toAmountActual,
        completedAt: existing.completedAt ?? payload.completedAt,
        bannerDismissed: existing.bannerDismissed
      };
      return;
    }
    state.byId[payload.id] = payload;
    state.ids.unshift(payload.id);
  });

  builder.addCase(updateCrossChainExchangeAction, (state, { payload }) => {
    const existing = state.byId[payload.id];
    if (!existing) return;
    if (payload.phase) existing.phase = payload.phase;
    if (payload.exolixStatus !== undefined) existing.exolixStatus = payload.exolixStatus;
    if (isMeaningfulHash(payload.hashIn)) existing.hashIn = payload.hashIn;
    if (isMeaningfulHash(payload.hashOut)) existing.hashOut = payload.hashOut;
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
    version: 0,
    ...storageConfig
  },
  crossChainSendReducer
);
