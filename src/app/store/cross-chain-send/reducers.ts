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

type Hash = { hash: string | null; link: string | null } | undefined;

const isMeaningfulHash = (value: Hash): value is { hash: string; link: string | null } =>
  Boolean(value && typeof value.hash === 'string' && value.hash.length > 0);

const hashEquals = (a: Hash, b: Hash) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.hash === b.hash && a.link === b.link;
};

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

    const nextPhase = payload.phase ?? existing.phase;
    const nextExolixStatus = payload.exolixStatus !== undefined ? payload.exolixStatus : existing.exolixStatus;
    const nextHashIn = isMeaningfulHash(payload.hashIn) ? payload.hashIn : existing.hashIn;
    const nextHashOut = isMeaningfulHash(payload.hashOut) ? payload.hashOut : existing.hashOut;
    const nextRefundHash = payload.refundHash ?? existing.refundHash;
    const nextToAmountActual = payload.toAmountActual !== undefined ? payload.toAmountActual : existing.toAmountActual;

    const changed =
      nextPhase !== existing.phase ||
      nextExolixStatus !== existing.exolixStatus ||
      !hashEquals(nextHashIn, existing.hashIn) ||
      !hashEquals(nextHashOut, existing.hashOut) ||
      nextRefundHash !== existing.refundHash ||
      nextToAmountActual !== existing.toAmountActual;

    if (!changed) return;

    existing.phase = nextPhase;
    existing.exolixStatus = nextExolixStatus;
    existing.hashIn = nextHashIn;
    existing.hashOut = nextHashOut;
    existing.refundHash = nextRefundHash;
    existing.toAmountActual = nextToAmountActual;
    existing.updatedAt = payload.updatedAt;
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
