import React, { FC } from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

import MoonPayImg from './assets/moonpay.png';
// import RampImg from './assets/ramp.png';
import { SelectCryptoSelectors } from './SelectCrypto.selectors';

export const Debits: FC = () => {
  const { trackEvent } = useAnalytics();
  return (
    <div>
      <div className={classNames('mx-auto max-w-sm', 'border-2 rounded-md px-4 py-8 mb-8')}>
        <img src={MoonPayImg} alt="MoonPayImg" />
        <div className="text-lg text-center">
          <T id="buyWithMoonPay" />
        </div>
        <div className="text-center w-64 mx-auto">
          <T id="buyWithMoonPayDescription" />
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
          onClick={() => trackEvent(SelectCryptoSelectors.MoonPay, AnalyticsEventCategory.ButtonPress)}
        >
          <T id="continue" />
        </Link>
      </div>
      {/* <div className={classNames('mx-auto max-w-sm', 'border-2 rounded-md px-4 py-8')}>
        <img src={RampImg} alt="RampImg" />
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
};
