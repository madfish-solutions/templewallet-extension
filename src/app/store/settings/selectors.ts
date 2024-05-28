import { useSelector } from '../root-state.selector';

export const useUserIdSelector = () => useSelector(({ settings }) => settings.userId);

export const useAnalyticsEnabledSelector = () => useSelector(({ settings }) => settings.isAnalyticsEnabled);

export const useOnRampPossibilitySelector = () => useSelector(({ settings }) => settings.isOnRampPossibility);
