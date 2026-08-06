import { useCallback, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { SubmitHandler } from 'react-hook-form';
import browser from 'webextension-polyfill';

import { useCryptoCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { toastError } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { buildMtPelerinBuyUrl } from 'lib/apis/mt-pelerin';
import { getMoonpaySign } from 'lib/apis/temple';
import { getMtPelerinNetworkByChain } from 'lib/buy-with-credit-card/provider-currencies.utils';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { fromTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';
import { assertUnreachable } from 'lib/utils/switch-cases';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { BuyWithCreditCardFormData } from '../types';

export const useBuyWithCreditCardFormSubmit = () => {
  const { silentSign } = useTempleClient();
  const [purchaseLinkLoading, setPurchaseLinkLoading] = useState(false);

  const formAnalytics = useFormAnalytics('BuyWithCreditCardForm');

  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();

  const moonpayCryptoCurrencies = useCryptoCurrenciesSelector(TopUpProviderId.MoonPay);
  const mtPelerinCryptoCurrencies = useCryptoCurrenciesSelector(TopUpProviderId.MtPelerin);

  const onSubmit = useCallback<SubmitHandler<BuyWithCreditCardFormData>>(
    async formValues => {
      const { inputAmount, inputCurrency, outputAmount, outputToken, provider } = formValues;

      const [, chainKind, chainId] = fromTopUpTokenSlug(outputToken.slug);

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
          case TopUpProviderId.MtPelerin: {
            const network = getMtPelerinNetworkByChain(chainKind, chainId);
            if (!network) {
              throw new Error(`Mt Pelerin network is not configured for chain ${chainId}`);
            }

            const accountPkh = chainKind === TempleChainKind.Tezos ? tezosAddress : evmAddress;

            if (!accountPkh) {
              throw new Error('There is no account address for the selected asset');
            }

            const code = (1000 + Math.floor(Math.random() * 9000)).toString();
            const signature = await silentSign(accountPkh, `MtPelerin-${code}`);

            url = buildMtPelerinBuyUrl({
              fiatCode: inputCurrency.code,
              cryptoCode: getProviderTokenCode(mtPelerinCryptoCurrencies, outputToken.slug),
              sourceAmount: inputAmount,
              network,
              accountPkh,
              code,
              signature
            });
            break;
          }
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
    [evmAddress, formAnalytics, moonpayCryptoCurrencies, mtPelerinCryptoCurrencies, tezosAddress]
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
