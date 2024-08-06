import { createAction } from '@reduxjs/toolkit';

import { BalanceMode } from './state';

export const setIsAnalyticsEnabledAction = createAction<boolean>('settings/SET_IS_ANALYTICS_ENABLED');

export const toggleBalanceModeAction = createAction<BalanceMode>('settings/TOGGLE_BALANCE_MODE');

export const setOnRampPossibilityAction = createAction<boolean>('settings/SET_ON_RAMP_POSSIBILITY_ACTION');

export const setConversionTrackedAction = createAction<void>('settings/SET_CONVERSION_TRACKED');

export const setPendingReactivateAdsAction = createAction<boolean>('settings/SET_PENDING_REACTIVATE_ADS');

export const setAdsImpressionsLinkedAction = createAction('settings/SET_ADS_IMPRESSIONS_LINKED');
