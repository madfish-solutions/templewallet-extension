import React from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { getCurrentLocale } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';

import { T } from '../../../../lib/i18n/react';
import { SelectCryptoSelectors } from '../SelectCrypto.selectors';

const API_KEY = 'pk_test_qO0hEwo5BlcLCGBUsDwARc4PSW80bmR';

export const MoonPay = () => {
  const { publicKeyHash: walletAddress } = useAccount();
  const selectedLocale = getCurrentLocale();
  const { trackEvent } = useAnalytics();

  return (
    <a
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
      href={`https://buy.moonpay.com?apiKey=${API_KEY}&currencyCode=xtz&walletAddress=${walletAddress}&colorCode=%23ed8936&language=${selectedLocale}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(SelectCryptoSelectors.MoonPay, AnalyticsEventCategory.ButtonPress)}
    >
      <T id="continue" />
    </a>
  );
};
