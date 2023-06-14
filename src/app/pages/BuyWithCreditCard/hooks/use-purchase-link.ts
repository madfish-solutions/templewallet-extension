import { useEffect, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import debounce from 'debounce-promise';

import { useUserIdSelector } from 'app/store/settings/selectors';
import { useFormAnalytics } from 'lib/analytics';
import { createAliceBobOrder, getMoonpaySign } from 'lib/apis/temple';
import { createBinanceConnectTradeOrder } from 'lib/apis/temple-static';
import { createOrder as createUtorgOrder } from 'lib/apis/utorg';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { useAccount } from 'lib/temple/front';
import { useStopper } from 'lib/ui/hooks';

import { BuyWithCreditCardFormValues } from '../types/buy-with-credit-card-form-values';

export const usePurchaseLink = (formValues: BuyWithCreditCardFormValues) => {
  const formAnalytics = useFormAnalytics('BuyWithCreditCardForm');
  const { publicKeyHash } = useAccount();
  const userId = useUserIdSelector();

  const [purchaseLinkLoading, setPurchaseLinkLoading] = useState(false);
  const [purchaseLink, setPurchaseLink] = useState<string>();
  const [updateLinkError, setUpdateLinkError] = useState<Error>();

  const loadingPurchaseLinkStopper = useStopper();

  const updatePurchaseLink = useMemo(
    () =>
      debounce(async (shouldStop: () => boolean) => {
        setPurchaseLink(undefined);
        setUpdateLinkError(undefined);

        const { inputAmount, inputCurrency, outputAmount, outputToken, topUpProvider } = formValues;

        if (
          !isDefined(topUpProvider?.outputAmount) ||
          !isDefined(inputAmount) ||
          !isDefined(outputAmount) ||
          !isDefined(topUpProvider)
        ) {
          setPurchaseLinkLoading(false);
          return;
        }

        setPurchaseLinkLoading(true);

        try {
          let newPurchaseLink: string | undefined;
          switch (topUpProvider.id) {
            case TopUpProviderId.MoonPay:
              newPurchaseLink = await getMoonpaySign(
                outputToken.code,
                '#ed8936',
                publicKeyHash,
                inputAmount,
                inputCurrency.code
              );
              break;
            case TopUpProviderId.Utorg:
              newPurchaseLink = await createUtorgOrder(
                outputAmount,
                inputCurrency.code,
                publicKeyHash,
                outputToken.code
              );
              break;
            case TopUpProviderId.BinanceConnect:
              newPurchaseLink = await createBinanceConnectTradeOrder(
                inputCurrency.code,
                outputToken.code,
                String(inputAmount),
                publicKeyHash
              );
              break;
            case TopUpProviderId.AliceBob:
              const { data } = await createAliceBobOrder(false, inputAmount.toFixed(), userId, publicKeyHash);
              newPurchaseLink = data.orderInfo.payUrl;
              break;
            default:
              newPurchaseLink = undefined;
          }

          if (shouldStop()) return;
          setPurchaseLink(newPurchaseLink);
        } catch (error: any) {
          if (shouldStop()) return;
          setUpdateLinkError(error);

          const analyticsProperties = {
            inputAmount,
            inputAsset: inputCurrency.code,
            outputAmount,
            outputAsset: outputToken.code,
            provider: topUpProvider.id
          };
          formAnalytics.trackSubmitFail(analyticsProperties);
        } finally {
          if (shouldStop()) return;
          setPurchaseLinkLoading(false);
        }
      }, 250),
    [
      formValues.inputCurrency.code,
      formValues.inputAmount,
      formValues.outputToken.code,
      formValues.outputAmount,
      formValues.topUpProvider?.id,
      formValues.topUpProvider?.outputAmount,
      publicKeyHash,
      userId,
      formAnalytics
    ]
  );

  useEffect(() => {
    updatePurchaseLink(loadingPurchaseLinkStopper.stopAndBuildChecker());

    return loadingPurchaseLinkStopper.stop;
  }, [updatePurchaseLink, loadingPurchaseLinkStopper]);

  return {
    purchaseLink,
    purchaseLinkLoading,
    updateLinkError
  };
};
