import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';

import { isPositiveNumber } from 'lib/utils/numbers';

import { TopUpProviderId } from './top-up-provider-id.enum';
import { PaymentProviderInterface } from './topup.interface';
import { ProviderErrors } from './types';

const isInRange = (min = 0, max = Infinity, inputAmount?: BigNumber | number) => {
  const inputAmountBN = isDefined(inputAmount) ? new BigNumber(inputAmount) : undefined;

  return !isDefined(inputAmountBN) || (inputAmountBN.gte(min) && inputAmountBN.lte(max));
};

const fiatPurchaseProvidersSortPredicate = (
  providerA: PaymentProviderInterface,
  providerB: PaymentProviderInterface
) => {
  const { outputAmount: providerAOutputAmount = 0 } = providerA;
  const { outputAmount: providerBOutputAmount = 0 } = providerB;

  return providerBOutputAmount - providerAOutputAmount;
};

export const getPaymentProvidersToDisplay = (
  allProviders: PaymentProviderInterface[],
  providersErrors: Partial<Record<TopUpProviderId, ProviderErrors>>,
  providersLoading: Partial<Record<TopUpProviderId, boolean>>,
  inputAmount?: BigNumber | number
) => {
  const filtered = filterPaymentProviders(allProviders, providersErrors, providersLoading, inputAmount);

  if (filtered.length < 2) {
    return filtered;
  }

  const sorted = filtered.sort(fiatPurchaseProvidersSortPredicate);

  return sorted.map((provider, index) => ({
    ...provider,
    isBestPrice: index === 0 && isPositiveNumber(provider.outputAmount)
  }));
};

const filterPaymentProviders = (
  allProviders: PaymentProviderInterface[],
  providersErrors: Partial<Record<TopUpProviderId, ProviderErrors>>,
  providersLoading: Partial<Record<TopUpProviderId, boolean>>,
  inputAmount?: BigNumber | number
) => {
  const shouldFilterByLimitsDefined = allProviders.some(
    ({ minInputAmount, maxInputAmount }) => isDefined(minInputAmount) && isDefined(maxInputAmount)
  );
  const shouldFilterByOutputAmount = allProviders.some(
    ({ outputAmount, id }) => isDefined(outputAmount) || providersLoading[id]
  );

  return allProviders.filter(({ id, minInputAmount, maxInputAmount, outputAmount }) => {
    const errors = providersErrors[id];
    if (isDefined(errors) && Object.values(errors).some(isDefined)) return false;

    const limitsAreDefined = isDefined(minInputAmount) && isDefined(maxInputAmount);
    const outputAmountIsLegit = outputAmount && outputAmount > 0;

    return (
      (!shouldFilterByLimitsDefined || limitsAreDefined) &&
      (!shouldFilterByOutputAmount || outputAmountIsLegit || Boolean(providersLoading[id])) &&
      isInRange(minInputAmount, maxInputAmount, inputAmount)
    );
  });
};
