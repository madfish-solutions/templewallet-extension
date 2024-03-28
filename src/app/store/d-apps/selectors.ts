import { useSelector } from '../index';

export const useTokenApyRateSelector = (slug: string): number | undefined =>
  useSelector(({ dApps }) => dApps.tokensApyRates[slug]);
