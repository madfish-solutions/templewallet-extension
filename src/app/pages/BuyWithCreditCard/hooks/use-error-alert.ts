import { useMemo, useEffect, useState } from 'react';

import { useCurrenciesErrorsSelector, usePairLimitsErrorsSelector } from 'app/store/buy-with-credit-card/selectors';
import { PAIR_NOT_FOUND_MESSAGE } from 'lib/buy-with-credit-card/constants';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t } from 'lib/i18n';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';
import { isDefined } from 'lib/utils/is-defined';

import { useBuyWithCreditCardForm } from './use-buy-with-credit-card-form';

const formDataErrorsMessagesKeys = [
  'errorWhileUpdatingPairLimits',
  'errorWhileGettingOutputEstimation',
  'errorWhileGettingCurrenciesList'
] as const;

export const useErrorAlert = (
  form: ReturnType<typeof useBuyWithCreditCardForm>,
  allPaymentProviders: PaymentProviderInterface[],
  amountsUpdateErrors: Record<TopUpProviderId, Error | undefined>
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

    const paymentProviderFetchErrors = [updatePairLimitsErrors, amountsUpdateErrors, currenciesErrors];

    for (let i = 0; i < paymentProviderFetchErrors.length; i++) {
      const errors = paymentProviderFetchErrors[i];
      const messageKey = formDataErrorsMessagesKeys[i];
      const [firstErrorEntry] = Object.entries(errors).filter(
        ([key, value]) => isDefined(value) && key !== TopUpProviderId.AliceBob && value !== PAIR_NOT_FOUND_MESSAGE
      );

      if (isDefined(firstErrorEntry)) {
        const [providerId, error] = firstErrorEntry;

        const providerName = allPaymentProviders.find(({ id }) => id === providerId)!.name;

        return t(messageKey, [providerName, typeof error === 'string' ? error : getAxiosQueryErrorMessage(error)]);
      }
    }

    return undefined;
  }, [updateLinkError, updatePairLimitsErrors, amountsUpdateErrors, allPaymentProviders, currenciesErrors]);
  useEffect(() => setShouldHideErrorAlert(false), [message]);

  return { onAlertClose, shouldHideErrorAlert, message };
};
