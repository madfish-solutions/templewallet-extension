import { useCallback, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { SubmitHandler } from 'react-hook-form-v7';
import browser from 'webextension-polyfill';

import { useCryptoCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { useUserIdSelector } from 'app/store/settings/selectors';
import { toastError } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { getMoonpaySign } from 'lib/apis/temple';
import { createOrder as createUtorgOrder } from 'lib/apis/utorg';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { fromTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t } from 'lib/i18n';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';
import { assertUnreachable } from 'lib/utils/switch-cases';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { BuyWithCreditCardFormData } from '../form-data.interface';

export const useBuyWithCreditCardFormSubmit = () => {
  const [purchaseLinkLoading, setPurchaseLinkLoading] = useState(false);

  const formAnalytics = useFormAnalytics('BuyWithCreditCardForm');
  const userId = useUserIdSelector();

  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();

  const moonpayCryptoCurrencies = useCryptoCurrenciesSelector(TopUpProviderId.MoonPay);
  const utorgCryptoCurrencies = useCryptoCurrenciesSelector(TopUpProviderId.Utorg);

  const onSubmit = useCallback<SubmitHandler<BuyWithCreditCardFormData>>(
    async formValues => {
      const { inputAmount, inputCurrency, outputAmount, outputToken, provider } = formValues;

      const [_, chainKind] = fromTopUpTokenSlug(outputToken.slug);

      const publicKeyHash = chainKind === TempleChainKind.Tezos ? tezosAddress : evmAddress;

      const analyticsProperties = {
        inputAmount: inputAmount?.toString(),
        inputAsset: inputCurrency.code,
        outputAmount: outputAmount?.toString(),
        outputAsset: outputToken.slug,
        provider: provider?.name
      };

      formAnalytics.trackSubmit(analyticsProperties);

      if (
        !isDefined(provider?.outputAmount) ||
        !isDefined(inputAmount) ||
        !isDefined(outputAmount) ||
        !isDefined(provider)
      ) {
        setPurchaseLinkLoading(false);
        return;
      }

      setPurchaseLinkLoading(true);

      try {
        let url: string;
        switch (provider.id) {
          case TopUpProviderId.MoonPay:
            url = await getMoonpaySign(
              getProviderTokenCode(moonpayCryptoCurrencies, outputToken.slug),
              '#ed8936',
              publicKeyHash,
              inputAmount,
              inputCurrency.code
            );
            break;
          case TopUpProviderId.Utorg:
            url = await createUtorgOrder(
              outputAmount,
              inputCurrency.code,
              publicKeyHash!,
              getProviderTokenCode(utorgCryptoCurrencies, outputToken.slug)
            );
            break;
          default:
            return assertUnreachable(provider.id);
        }

        await browser.tabs.create({ url });
      } catch (error: any) {
        toastError(t('errorWhileCreatingOrder', getAxiosQueryErrorMessage(error)));

        formAnalytics.trackSubmitFail(analyticsProperties);
      } finally {
        setPurchaseLinkLoading(false);
      }
    },
    [evmAddress, formAnalytics, moonpayCryptoCurrencies, tezosAddress, userId, utorgCryptoCurrencies]
  );

  return {
    onSubmit,
    purchaseLinkLoading
  };
};

const getProviderTokenCode = (tokens: TopUpOutputInterface[], tokenSlug: string) => {
  const providerToken = tokens.find(({ slug }) => slug === tokenSlug);
  if (!providerToken) throw new Error(t('pairNotFoundError'));

  return providerToken.code;
};
