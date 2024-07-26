import { useSelector } from '../root-state.selector';

export const useUserIdSelector = () => useSelector(({ settings }) => settings.userId);

export const useAnalyticsEnabledSelector = () => useSelector(({ settings }) => settings.isAnalyticsEnabled);

export const useBalanceModeSelector = () => useSelector(({ settings }) => settings.balanceMode);

export const useOnRampPossibilitySelector = () => useSelector(({ settings }) => settings.isOnRampPossibility);

export const useIsConversionTrackedSelector = () => useSelector(({ settings }) => settings.isConversionTracked);

export const useIsPendingReactivateAdsSelector = () => useSelector(({ settings }) => settings.pendingReactivateAds);

export const useIsAdsImpressionsLinkedSelector = () => useSelector(({ settings }) => settings.adsImpressionsLinked);
