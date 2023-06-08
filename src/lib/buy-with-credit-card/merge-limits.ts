import { isDefined } from 'lib/utils/is-defined';

import { TopUpProviderPairLimits } from './topup.interface';

export const mergeLimits = (limits: Array<Partial<TopUpProviderPairLimits> | undefined>) =>
  limits.reduce<Partial<TopUpProviderPairLimits>>((result, limits) => {
    const { min, max } = limits ?? {};

    if (isDefined(min)) {
      result.min = Math.min(result.min ?? Infinity, min);
    }
    if (isDefined(max)) {
      result.max = Math.max(result.max ?? 0, max);
    }

    return result;
  }, {});
