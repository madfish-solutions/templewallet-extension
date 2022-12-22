import React, { FC, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import { FormSubmitButton } from 'app/atoms';
import CopyButton from 'app/atoms/CopyButton';
import Divider from 'app/atoms/Divider';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { WithdrawSelectors } from 'app/pages/Withdraw/Withdraw.selectors';
import { AliceBobOrderStatus } from 'lib/apis/temple';
import { T, TID } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

import { useUpdatedOrderInfo } from '../hooks/useUpdatedOrderInfo';
import { StepProps } from './step.props';

export const OrderStatusStep: FC<StepProps> = ({ orderInfo, setStep, setOrderInfo, setIsApiError }) => {
  const { copy } = useCopyToClipboard();

  useUpdatedOrderInfo(orderInfo, setOrderInfo, setIsApiError);

  const { status, id: orderId } = orderInfo;

  const truncatedOrderId = useMemo(() => orderId.slice(0, 10) + '...' + orderId.slice(-5), [orderId]);

  const exchangeInProgress = useMemo(
    () =>
      status === AliceBobOrderStatus.WAITING ||
      status === AliceBobOrderStatus.EXCHANGING ||
      status === AliceBobOrderStatus.SENDING,
    [status]
  );

  const newSellButtonHandler = useCallback(() => {
    setStep(0);
    setOrderInfo(null);
  }, [setOrderInfo, setStep]);

  return (
    <>
      <div className="font-inter text-gray-700 text-center">
        <p
          style={{ fontSize: 19 }}
          className={classNames('mt-6 mb-2', status === AliceBobOrderStatus.COMPLETED && 'text-green-500')}
        >
          {status}
        </p>
        <p className="text-sm text-gray-600">
          <T id={(status.toLowerCase() + 'StatusDescription') as TID} />
        </p>
      </div>

      <Divider className="mt-8" />
      <div className="flex justify-between items-baseline mt-4">
        <p className="text-gray-600 text-xs">
          <T id={'transactionId'} />
        </p>
        <span className="flex flex-row justify-center">
          <p className="text-gray-910">{truncatedOrderId}</p>
          <CopyButton text={orderId} type="link">
            <CopyIcon className="h-4 ml-1 w-auto stroke-orange stroke-2" onClick={copy} />
          </CopyButton>
        </span>
      </div>

      <FormSubmitButton
        className="w-full justify-center border-none mt-6"
        style={{
          background: '#4299e1',
          paddingTop: '0.625rem',
          paddingBottom: '0.625rem'
        }}
        disabled={exchangeInProgress}
        trackID={WithdrawSelectors.AliceBobNewSellButton}
        onClick={newSellButtonHandler}
      >
        <T id="newSell" />
      </FormSubmitButton>
    </>
  );
};
