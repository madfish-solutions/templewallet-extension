import { createAction } from '@reduxjs/toolkit';

import { BalanceMode } from './state';

export const setIsAnalyticsEnabledAction = createAction<boolean>('settings/SET_IS_ANALYTICS_ENABLED');

export const toggleBalanceModeAction = createAction<BalanceMode>('settings/TOGGLE_BALANCE_MODE');

export const setOnRampPossibilityAction = createAction<boolean>('settings/SET_ON_RAMP_POSSIBILITY_ACTION');
