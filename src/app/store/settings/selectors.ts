import { useSelector } from '../root-state.selector';

export const useUserIdSelector = () => useSelector(({ settings }) => settings.userId);

export const useAnalyticsEnabledSelector = () => useSelector(({ settings }) => settings.isAnalyticsEnabled);

export const useOnRampAssetSelector = () => useSelector(({ settings }) => settings.onRampAsset);

export const useOnRampTitleSelector = () => useSelector(({ settings }) => settings.onRampTitle);

export const useIsPendingReactivateAdsSelector = () => useSelector(({ settings }) => settings.pendingReactivateAds);

export const useIsAdsImpressionsLinkedSelector = () => useSelector(({ settings }) => settings.adsImpressionsLinked);

export const useReferralLinksEnabledSelector = () => useSelector(({ settings }) => settings.referralLinksEnabled);

export const useTestnetModeEnabledSelector = () => useSelector(({ settings }) => settings.isTestnetModeEnabled);

export const useFavoriteTokensSelector = () => useSelector(({ settings }) => settings.favoriteTokens);
