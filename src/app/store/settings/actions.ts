import { createAction } from '@reduxjs/toolkit';

export const setIsAnalyticsEnabledAction = createAction<boolean>('settings/SET_IS_ANALYTICS_ENABLED');

export const setOnRampAssetAction = createAction<string | null>('settings/SET_ON_RAMP_ASSET_ACTION');

export const setConversionTrackedAction = createAction<void>('settings/SET_CONVERSION_TRACKED');

export const setPendingReactivateAdsAction = createAction<boolean>('settings/SET_PENDING_REACTIVATE_ADS');

export const setAdsImpressionsLinkedAction = createAction('settings/SET_ADS_IMPRESSIONS_LINKED');

export const setReferralLinksEnabledAction = createAction<boolean>('settings/SET_REFERRAL_LINKS_ENABLED');

export const setIsTestnetModeEnabledAction = createAction<boolean>('settings/SET_IS_TESTNET_MODE_ENABLED');
