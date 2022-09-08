import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';

import { ReactComponent as MoonPayIcon } from '../../../misc/exchanges-logos/moonpay.svg';
import { MoonPay } from '../../SelectCrypto/MoonPay/MoonPay';

export const Debit: FC = () => {
  return (
    <div>
      <div className={classNames('mx-auto max-w-sm flex flex-col items-center', 'border-2 rounded-md p-4 mb-4')}>
        <MoonPayIcon />
        <div className="text-lg text-center mt-2">
          <T id="sellWithMoonPay" />
        </div>
        <div className="text-center w-64 mx-auto text-gray-700 mt-2">
          <T id="sellWithMoonPayDescription" />
        </div>
        <MoonPay />
      </div>
    </div>
  );
};
