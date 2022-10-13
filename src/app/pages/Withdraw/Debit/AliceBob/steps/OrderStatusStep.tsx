import React, { FC } from 'react';

import { AliceBobOrderInfo } from 'lib/alice-bob-api';
import { T } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

import { FormSubmitButton } from '../../../../../atoms';
import CopyButton from '../../../../../atoms/CopyButton';
import Divider from '../../../../../atoms/Divider';
import { ReactComponent as CopyIcon } from '../../../../../icons/copy.svg';

interface Props {
  orderInfo?: AliceBobOrderInfo;
}

export const OrderStatusStep: FC<Props> = () => {
  const { copy } = useCopyToClipboard();

  return (
    <>
      <div className="font-inter text-gray-700 text-center">
        <p style={{ fontSize: 19 }} className="mb-2">
          <T id={'completed'} />
        </p>
        <p className="text-sm text-gray-600">In the process of execution of the order, an error occurred.</p>
      </div>

      <Divider className="mt-8" />
      <div className="flex justify-between items-baseline mt-4">
        <p className="text-gray-600 text-xs">
          <T id={'transactionId'} />
        </p>
        <span className="flex flex-row justify-center">
          <p className="text-gray-910">69951ec1-6b7a-4eab-ab89-d7f3592788a1</p>
          <CopyButton text={'69951ec1-6b7a-4eab-ab89-d7f3592788a1'} type="link">
            <CopyIcon className="h-4 ml-1 w-auto stroke-orange stroke-2" onClick={() => copy()} />
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
      >
        <T id="newSell" />
      </FormSubmitButton>
    </>
  );
};
