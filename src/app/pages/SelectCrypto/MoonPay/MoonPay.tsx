import React from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';

import { T } from '../../../../lib/i18n/react';
import { SelectCryptoSelectors } from '../SelectCrypto.selectors';
import { useSignedMoonPayUrl } from './useSignedMoonPayUrl';

export const MoonPay = () => {
  const { trackEvent } = useAnalytics();
  const { signedUrl, isDisabled } = useSignedMoonPayUrl();

  return (
    <a
      className={classNames(
        isDisabled ? 'shadow-inner pointer-events-none opacity-75' : 'shadow-sm hover:shadow focus:shadow',
        'py-2 px-4 rounded mt-4',
        'border-2',
        'border-blue-500 hover:border-blue-600 focus:border-blue-600',
        'flex items-center justify-center',
        'text-white',
        'text-base font-semibold',
        'transition ease-in-out duration-300',
        'bg-blue-500',
        'w-full'
      )}
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(SelectCryptoSelectors.MoonPay, AnalyticsEventCategory.ButtonPress)}
    >
      <T id="continue" />
    </a>
  );
};
