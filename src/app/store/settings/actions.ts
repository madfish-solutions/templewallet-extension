import { createAction } from '@reduxjs/toolkit';

export const setIsAnalyticsEnabledAction = createAction<boolean>('settings/SET_IS_ANALYTICS_ENABLED');

export const setOnRampPossibilityAction = createAction<boolean>('settings/SET_ON_RAMP_POSSIBILITY_ACTION');

export const setConversionTrackedAction = createAction('settings/SET_CONVERSION_TRACKED');

export const setToastsContainerBottomShiftAction = createAction<number>('settings/SET_TOASTS_CONTAINER_BOTTOM_SHIFT');
