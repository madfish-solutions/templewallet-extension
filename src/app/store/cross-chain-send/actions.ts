import { createAction } from '@reduxjs/toolkit';

import { CrossChainExchange, CrossChainPhase } from './state';

export const addCrossChainExchangeAction = createAction<CrossChainExchange>('cross-chain-send/ADD_EXCHANGE');

export const updateCrossChainExchangeAction = createAction<{
  id: string;
  phase?: CrossChainPhase;
  exolixStatus?: string;
  hashIn?: { hash: string | null; link: string | null };
  hashOut?: { hash: string | null; link: string | null };
  refundHash?: string;
  toAmountActual?: string;
  updatedAt: number;
}>('cross-chain-send/UPDATE_EXCHANGE');

export const removeCrossChainExchangeAction = createAction<string>('cross-chain-send/REMOVE_EXCHANGE');

export const monitorCrossChainExchangesAction = createAction<void>('cross-chain-send/MONITOR');

export const dismissCrossChainBannerAction = createAction<string>('cross-chain-send/DISMISS_BANNER');
