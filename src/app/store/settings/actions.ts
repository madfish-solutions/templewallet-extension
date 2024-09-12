import { createAction } from '@reduxjs/toolkit';

export const setIsAnalyticsEnabledAction = createAction<boolean>('settings/SET_IS_ANALYTICS_ENABLED');

export const setOnRampPossibilityAction = createAction<boolean>('settings/SET_ON_RAMP_POSSIBILITY_ACTION');

export const setConversionTrackedAction = createAction<void>('settings/SET_CONVERSION_TRACKED');

export const setPendingReactivateAdsAction = createAction<boolean>('settings/SET_PENDING_REACTIVATE_ADS');

export const setShowAgreementsCounterAction = createAction<number>('settings/SET_SHOW_AGREEMENTS_COUNTER');

export const setShouldShowTermsOfUseUpdateOverlayAction = createAction<boolean>(
  'settings/SET_SHOULD_SHOW_TERMS_OF_USE_UPDATE_OVERLAY'
);

export const setAdsImpressionsLinkedAction = createAction('settings/SET_ADS_IMPRESSIONS_LINKED');

export const setAcceptedTermsVersionAction = createAction<number>('settings/SET_TERMS_ACCEPTED_VERSION');

export const setReferralLinksEnabledAction = createAction<boolean>('settings/SET_REFERRAL_LINKS_ENABLED');

export const setToastsContainerBottomShiftAction = createAction<number>('settings/SET_TOASTS_CONTAINER_BOTTOM_SHIFT');
