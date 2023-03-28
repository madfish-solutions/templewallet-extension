import { useSelector } from '../index';

export const useAnalyticsEnabledSelector = () => useSelector(({ settings }) => settings.isAnalyticsEnabled);

export const useUserIdSelector = () => useSelector(({ settings }) => settings.userId);
