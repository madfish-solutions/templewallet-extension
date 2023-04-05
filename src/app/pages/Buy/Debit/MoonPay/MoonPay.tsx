import React from 'react';

import classNames from 'clsx';

import { Anchor } from 'app/atoms';
import { T } from 'lib/i18n';

import { BuySelectors } from '../../Buy.selectors';
import { useSignedMoonPayUrl } from './useSignedMoonPayUrl';

export const MoonPay = () => {
  const signedUrl = useSignedMoonPayUrl();

  return (
    <Anchor
      className={classNames(
        'shadow-sm hover:shadow focus:shadow',
        'py-2 px-4 rounded mt-4',
        'border-2',
        'border-blue-500 hover:border-blue-600 focus:border-blue-600',
        'flex items-center justify-center',
        'text-white',
        'text-base font-medium',
        'transition ease-in-out duration-300',
        'bg-blue-500',
        'w-full'
      )}
      href={signedUrl}
      testID={BuySelectors.MoonPayButton}
      treatAsButton={true}
    >
      <T id="continue" />
    </Anchor>
  );
};
