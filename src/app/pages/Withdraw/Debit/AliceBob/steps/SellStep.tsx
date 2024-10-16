import React, { memo, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import { FormSubmitButton } from 'app/atoms';
import StyledCopyButton from 'app/atoms/StyledCopyButton';
import { ReactComponent as CopyIcon } from 'app/icons/monochrome/copy.svg';
import { WithdrawSelectors } from 'app/pages/Withdraw/Withdraw.selectors';
import { AnalyticsEventCategory, setTestID, useAnalytics, useFormAnalytics } from 'lib/analytics';
import { AliceBobOrderStatus, cancelAliceBobOrder } from 'lib/apis/temple';
import { toTransferParams } from 'lib/assets/contract.utils';
import { T, TID } from 'lib/i18n';
import { TEZOS_METADATA } from 'lib/metadata';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { AccountForTezos } from 'temple/accounts';
import { getTezosToolkitWithSigner } from 'temple/front';

import { useUpdatedOrderInfo } from '../hooks/useUpdatedOrderInfo';

import { StepProps } from './step.props';

interface SellStepProps extends StepProps {
  account: AccountForTezos;
  rpcUrl: string;
}

export const SellStep = memo<SellStepProps>(
  ({ account, rpcUrl, orderInfo, isApiError, setStep, setOrderInfo, setIsApiError }) => {
    const { copy } = useCopyToClipboard();

    const formAnalytics = useFormAnalytics('AliceBobWithdrawSendProgress');
    const { trackEvent } = useAnalytics();

    useUpdatedOrderInfo(orderInfo, setOrderInfo, setIsApiError);

    const [isLoading, setIsLoading] = useState(false);

    const { fromAmount, toAmount, id: orderId, status, toRate, payCryptoAddress } = orderInfo;

    const truncatedOrderId = useMemo(() => orderId.slice(0, 10) + '...' + orderId.slice(-5), [orderId]);

    const exchangeRate = useMemo(
      () => new BigNumber(toAmount).div(fromAmount).dp(2, BigNumber.ROUND_FLOOR).toString(),
      [fromAmount, toAmount]
    );

    const totalFee = useMemo(
      () => new BigNumber(fromAmount).times(toRate).minus(toAmount).dp(2, BigNumber.ROUND_FLOOR).toString(),
      [fromAmount, toAmount, toRate]
    );

    const cancelButtonHandler = useCallback(async () => {
      setStep(0);
      setOrderInfo(null);

      trackEvent(WithdrawSelectors.aliceBobCancelOrderButton, AnalyticsEventCategory.ButtonPress);

      await cancelAliceBobOrder(orderId);
    }, [orderId, setOrderInfo, setStep, trackEvent]);

    const sendButtonHandler = async () => {
      setIsLoading(true);
      formAnalytics.trackSubmit();
      try {
        const tezos = getTezosToolkitWithSigner(rpcUrl, account.ownerAddress || account.address);

        const transferParams = await toTransferParams(
          tezos,
          'tez',
          TEZOS_METADATA,
          account.address,
          payCryptoAddress,
          fromAmount
        );
        const { suggestedFeeMutez } = await tezos.estimate.transfer(transferParams);
        await tezos.wallet.transfer({ ...transferParams, fee: suggestedFeeMutez }).send();

        formAnalytics.trackSubmitSuccess();

        setStep(2);
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        if (err.message === 'Declined') {
          return;
        }

        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <>
        <div className="font-inter text-gray-700 text-center">
          <p style={{ fontSize: 19 }} className="mt-6 mb-2">
            <T id={'transactionId'} />
          </p>
          <span className="flex flex-row justify-center">
            <p className="text-gray-910" style={{ fontSize: 17 }}>
              {truncatedOrderId}
            </p>
            <StyledCopyButton text={orderId} type="link">
              <CopyIcon className="h-4 ml-1 w-auto stroke-orange-500 stroke-2" onClick={copy} />
            </StyledCopyButton>
          </span>
        </div>

        {status !== AliceBobOrderStatus.WAITING && (
          <div
            className="py-2 px-4 rounded-lg border border-red-700 mt-12 mb-10"
            style={{ backgroundColor: '#FCFAFC' }}
          >
            <p className="text-red-700 text-font-regular">{status}</p>
            <p className="text-red-700 text-font-description">
              <T id={(status.toLowerCase() + 'StatusDescription') as TID} />
            </p>
          </div>
        )}

        <div className="flex justify-between items-baseline mt-10">
          <p className="text-gray-600 text-font-description">
            <T id="youSell" />
          </p>
          <p className="text-sm font-medium text-gray-910">{fromAmount} TEZ</p>
        </div>

        <div className="flex justify-between items-baseline mt-2">
          <p className="text-gray-600 text-font-description">
            <T id="exchangeRate" />:
          </p>
          <p className="text-font-description text-gray-600">1 TEZ ≈ {exchangeRate} UAH</p>
        </div>

        <div className="flex justify-between items-baseline mt-2">
          <p className="text-gray-600 text-font-description">
            <T id="fee" />:
          </p>
          <p className="text-font-description text-gray-600">{totalFee} UAH</p>
        </div>

        <div className="flex justify-between items-baseline mt-2">
          <p className="text-gray-600 text-font-description">
            <T id={'youGet'} />
          </p>
          <p className="text-sm font-medium text-gray-910">
            {new BigNumber(toAmount).dp(2, BigNumber.ROUND_FLOOR).toNumber()} UAH
          </p>
        </div>

        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{
            background: '#4299e1',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem'
          }}
          disabled={status !== AliceBobOrderStatus.WAITING || isApiError}
          loading={isLoading}
          onClick={sendButtonHandler}
          testID={WithdrawSelectors.aliceBobSellButton}
        >
          <T id="sell" />
        </FormSubmitButton>

        <p
          onClick={cancelButtonHandler}
          className="font inter font-medium text-red-700 text-sm mt-4 inline-block cursor-pointer inline-block w-auto"
          {...setTestID(WithdrawSelectors.aliceBobCancelButton)}
        >
          <T id="cancel" />
        </p>
      </>
    );
  }
);
