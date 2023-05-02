import { isDefined } from 'lib/utils/is-defined';

import { TopUpProviderPairLimits } from './topup.interface';

export const intersectLimits = (limits: Array<Partial<TopUpProviderPairLimits> | undefined>) =>
  limits.reduce<Partial<TopUpProviderPairLimits>>((result, limits) => {
    const { min, max } = limits ?? {};

    if (isDefined(min)) {
      result.min = Math.max(result.min ?? 0, min);
    }
    if (isDefined(max)) {
      result.max = Math.min(result.max ?? Infinity, max);
    }

    return result;
  }, {});
