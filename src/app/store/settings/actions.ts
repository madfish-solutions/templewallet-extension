import { createAction } from '@reduxjs/toolkit';

export const setIsAnalyticsEnabledAction = createAction<boolean>('settings/SET_IS_ANALYTICS_ENABLED');

export const setOnRampPossibilityAction = createAction<boolean>('settings/SET_ON_RAMP_POSSIBILITY_ACTION');

export const setConversionTrackedAction = createAction<void>('settings/SET_CONVERSION_TRACKED');

export const setPendingReactivateAdsAction = createAction<boolean>('settings/SET_PENDING_REACTIVATE_ADS');

export const setAdsImpressionsLinkedAction = createAction('settings/SET_ADS_IMPRESSIONS_LINKED');

export const setReferralLinksEnabledAction = createAction<boolean>('settings/SET_REFERRAL_LINKS_ENABLED');

export const setToastsContainerBottomShiftAction = createAction<number>('settings/SET_TOASTS_CONTAINER_BOTTOM_SHIFT');

export const setIsTestnetModeEnabledAction = createAction<boolean>('settings/SET_IS_TESTNET_MODE_ENABLED');
