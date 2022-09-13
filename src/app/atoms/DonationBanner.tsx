import React, { FC } from 'react';

import classNames from 'clsx';

import { ReactComponent as Ukraine } from 'app/icons/ukraine.svg';

import { AnalyticsEventCategory, useAnalytics } from '../../lib/analytics';
import { T } from '../../lib/i18n/react';

export const DonationBanner: FC = () => {
  const { trackEvent } = useAnalytics();

  return (
    <a
      className={classNames('flex flex-col mx-auto mt-2', 'mb-2 p-2')}
      style={{
        borderRadius: '4px',
        maxWidth: '100px',
        backgroundColor: '#E5F2FF'
      }}
      href="https://donate.tezos.org.ua"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('UkraineDonation', AnalyticsEventCategory.ButtonPress)}
    >
      <div className="flex flex-row justify-center px-2 items-center">
        <div className="flex flex-col">
          <span className="font-inter font-semibold text-base" style={{ color: '#007AFF' }}>
            <T id={'support'} />
          </span>
        </div>
        <div className="ml-1">
          <Ukraine />
        </div>
      </div>
    </a>
  );
};
