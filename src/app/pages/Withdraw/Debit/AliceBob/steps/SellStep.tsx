import React, { FC } from 'react';

import { AliceBobOrderInfo } from 'lib/alice-bob-api';
import { T } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

import { FormSubmitButton } from '../../../../../atoms';
import CopyButton from '../../../../../atoms/CopyButton';
import { ReactComponent as CopyIcon } from '../../../../../icons/copy.svg';

interface Props {
  orderInfo?: AliceBobOrderInfo;
}

export const SellStep: FC<Props> = () => {
  const { copy } = useCopyToClipboard();

  return (
    <>
      <div className="font-inter text-gray-700 text-center">
        <p style={{ fontSize: 19 }} className="mb-2">
          <T id={'transactionId'} />
        </p>
        <span className="flex flex-row justify-center">
          <p className="text-gray-910" style={{ fontSize: 17 }}>
            {'69951ec1-6b7a-4eab-ab89-d7f3592788a1'}
          </p>
          <CopyButton text={'69951ec1-6b7a-4eab-ab89-d7f3592788a1'} type="link">
            <CopyIcon className="h-4 ml-1 w-auto stroke-orange stroke-2" onClick={() => copy()} />
          </CopyButton>
        </span>
      </div>

      <div className="flex justify-between items-baseline mt-10">
        <p className="text-gray-600 text-xs">
          <T id="youSell" />
        </p>
        <p className="text-xs text-gray-910">12 TEZ</p>
      </div>

      <div className="flex justify-between items-baseline mt-2">
        <p className="text-gray-600 text-xs">
          <T id="exchangeRate" />:
        </p>
        <p className="text-xs text-gray-910">1 TEZ ≈ 10 UAH</p>
      </div>

      <div className="flex justify-between items-baseline mt-2">
        <p className="text-gray-600 text-xs">
          <T id="fee" />:
        </p>
        <p className="text-xs text-gray-910">12 UAH</p>
      </div>

      <div className="flex justify-between items-baseline mt-2">
        <p className="text-gray-600 text-xs">
          <T id={'youGet'} />
        </p>
        <p className="text-xs text-gray-910">120 UAH</p>
      </div>

      <FormSubmitButton
        className="w-full justify-center border-none mt-6"
        style={{
          background: '#4299e1',
          paddingTop: '0.625rem',
          paddingBottom: '0.625rem'
        }}
      >
        <T id="sell" />
      </FormSubmitButton>

      <p
        onClick={() => {
          //setStep(0);
        }}
        className="font inter font-medium text-red-700 text-sm mt-4 inline-block cursor-pointer inline-block w-auto"
      >
        <T id="cancel" />
      </p>
    </>
  );
};
