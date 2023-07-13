import { isDefined } from '@rnw-community/shared';

import { PairLimits } from 'app/store/buy-with-credit-card/state';
import { isTruthy } from 'lib/utils';

import { TopUpProviderPairLimits } from './topup.interface';

export const mergeProvidersLimits = (limits: PairLimits | undefined) => {
  if (!isDefined(limits)) return {};

  const limitsArray = Object.values(limits)
    .map(item => item.data)
    .filter(isTruthy);

  return limitsArray.reduce<Partial<TopUpProviderPairLimits>>((result, limits) => {
    const { min, max } = limits;

    if (isDefined(min)) {
      result.min = Math.min(result.min ?? Infinity, min);
    }
    if (isDefined(max)) {
      result.max = Math.max(result.max ?? 0, max);
    }

    return result;
  }, {});
};
