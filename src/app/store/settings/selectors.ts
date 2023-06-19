import { useSelector } from '../index';

export const useUserIdSelector = () => useSelector(({ settings }) => settings.userId);

export const useAnalyticsEnabledSelector = () => useSelector(({ settings }) => settings.isAnalyticsEnabled);

export const useBalanceModeSelector = () => useSelector(({ settings }) => settings.balanceMode);

export const useOnRampPossibilitySelector = () => useSelector(({ settings }) => settings.isOnRampPossibility);
