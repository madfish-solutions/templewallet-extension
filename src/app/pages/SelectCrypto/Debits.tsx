import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';

import { ReactComponent as MoonPayIcon } from './assets/MoonPay.svg';
// import { ReactComponent as RampIcon } from './assets/Ramp.svg';
import { MoonPay } from './MoonPay/MoonPay';

export const Debits: FC = () => (
  <div>
    <div className={classNames('mx-auto max-w-sm flex flex-col items-center', 'border-2 rounded-md p-4')}>
      <MoonPayIcon />
      <div className="text-lg text-center">
        <T id="buyWithMoonPay" />
      </div>
      <div className="text-center w-64 mx-auto">
        <T id="buyWithMoonPayDescription" />
      </div>
      <MoonPay />
    </div>
    {/* <div className={classNames('mx-auto max-w-sm', 'border-2 rounded-md p-4')}>
        <RampIcon />
        <div className="text-lg text-center">
          <T id="buyWithRamp" />
        </div>
        <div className="text-center w-64 mx-auto">
          <T id="buyWithRampDescription" />
        </div>
        <Link
          className={classNames(
            'py-2 px-4 rounded mt-8',
            'border-2',
            'border-blue-500 hover:border-blue-600 focus:border-blue-600',
            'flex items-center justify-center',
            'text-white',
            'shadow-sm hover:shadow focus:shadow',
            'text-base font-semibold',
            'transition ease-in-out duration-300',
            'bg-blue-500',
            'w-full'
          )}
          to={'/buy/crypto'}
          onClick={() => trackEvent(SelectCryptoSelectors.Ramp, AnalyticsEventCategory.ButtonPress)}
        >
          <T id="continue" />
        </Link>
      </div> */}
  </div>
);
