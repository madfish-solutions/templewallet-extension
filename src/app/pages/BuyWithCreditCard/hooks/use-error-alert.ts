import { useMemo, useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useCurrenciesErrorsSelector, usePairLimitsErrorsSelector } from 'app/store/buy-with-credit-card/selectors';
import { PAIR_NOT_FOUND_MESSAGE } from 'lib/buy-with-credit-card/constants';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';
import { ProviderErrors } from 'lib/buy-with-credit-card/types';
import { t, TID } from 'lib/i18n';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';

import { useBuyWithCreditCardForm } from './use-buy-with-credit-card-form';

export const useErrorAlert = (
  form: ReturnType<typeof useBuyWithCreditCardForm>,
  allPaymentProviders: PaymentProviderInterface[],
  allProvidersErrors: Record<TopUpProviderId, ProviderErrors>
) => {
  const { updateLinkError, formValues } = form;
  const { inputCurrency, outputToken } = formValues;
  const currenciesErrors = useCurrenciesErrorsSelector();
  const updatePairLimitsErrors = usePairLimitsErrorsSelector(inputCurrency.code, outputToken.code);

  const [shouldHideErrorAlert, setShouldHideErrorAlert] = useState(false);

  const onAlertClose = () => setShouldHideErrorAlert(true);

  const message = useMemo(() => {
    // TODO: return handling errors for Alice&Bob as soon as this service starts working
    if (isDefined(updateLinkError)) {
      return t('errorWhileCreatingOrder', getAxiosQueryErrorMessage(updateLinkError));
    }

    for (const providerId in allProvidersErrors) {
      if (providerId === TopUpProviderId.AliceBob) continue;

      const errors = allProvidersErrors[providerId as TopUpProviderId];

      if (errors.currencies === PAIR_NOT_FOUND_MESSAGE || errors.limits === PAIR_NOT_FOUND_MESSAGE) continue;

      const leadingError = getLeadingError(errors);
      if (!isDefined(leadingError)) continue;

      const { i18nKey, error } = leadingError;
      const providerName = allPaymentProviders.find(({ id }) => id === providerId)!.name;

      return t(i18nKey, [providerName, typeof error === 'string' ? error : getAxiosQueryErrorMessage(error)]);
    }

    return undefined;
  }, [updateLinkError, updatePairLimitsErrors, allProvidersErrors, allPaymentProviders, currenciesErrors]);

  useEffect(() => setShouldHideErrorAlert(false), [message]);

  return { onAlertClose, shouldHideErrorAlert, message };
};

interface LeadingError {
  i18nKey: TID;
  error: string | Error;
}

const getLeadingError = (errors: ProviderErrors): LeadingError | undefined => {
  if (isDefined(errors.currencies))
    return {
      i18nKey: 'errorWhileGettingCurrenciesList',
      error: errors.currencies
    };

  if (isDefined(errors.limits))
    return {
      i18nKey: 'errorWhileUpdatingPairLimits',
      error: errors.limits
    };

  if (isDefined(errors.output))
    return {
      i18nKey: 'errorWhileGettingOutputEstimation',
      error: errors.output
    };
  return undefined;
};
