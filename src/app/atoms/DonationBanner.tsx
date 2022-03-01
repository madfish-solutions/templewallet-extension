import React, { FC } from 'react';

import classNames from 'clsx';

import { ReactComponent as Ukraine } from 'app/icons/ukraine.svg';

import { AnalyticsEventCategory, useAnalytics } from '../../lib/analytics';
import { T } from '../../lib/i18n/react';
import { useAppEnv } from '../env';
export const DonationBanner: FC = () => {
  const { popup } = useAppEnv();
  const { trackEvent } = useAnalytics();

  return (
    <div
      className={classNames('flex flex-col mx-auto mt-2', popup ? 'mb-6 p-4' : 'mb-2 p-6')}
      style={{
        border: '1px solid #EA2424',
        borderRadius: '4px',
        maxWidth: '360px'
      }}
    >
      <div className="flex flex-row mb-4">
        <div className="h-12 mr-4 my-auto">
          <Ukraine />
        </div>
        <div className="flex flex-col">
          <span className="font-inter font-semibold" style={{ fontSize: '17px' }}>
            <T id={'standWithUkraine'} />
          </span>
          <span className="font-inter font-normal text-xs text-gray-700">
            <T id={'supportUkrainians'} />
          </span>
        </div>
      </div>
      <a
        className={classNames(
          'py-2 px-4 rounded',
          'border-2',
          'border-blue-500 hover:border-blue-600 focus:border-blue-600',
          'flex items-center justify-center',
          'text-white',
          'shadow-sm hover:shadow focus:shadow',
          'font-inter font-normal text-sm',
          'transition ease-in-out duration-300',
          'bg-blue-500',
          'w-full'
        )}
        href="https://www.donate.tezos.org.ua"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('UkraineDonation', AnalyticsEventCategory.ButtonPress)}
      >
        <T id={'donate'} />
      </a>
    </div>
  );
};
