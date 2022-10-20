import React, { FC } from 'react';

import classNames from 'clsx';

import { ReactComponent as Ukraine } from 'app/icons/ukraine.svg';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n';

export const DonationBanner: FC = () => {
  const { trackEvent } = useAnalytics();

  return (
    <a
      className={classNames('flex flex-col items-center justify-center')}
      style={{
        borderRadius: '4px',
        maxWidth: '100px',
        height: '28px',
        backgroundColor: '#E5F2FF'
      }}
      href="https://donate.tezos.org.ua"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('UkraineDonation', AnalyticsEventCategory.ButtonPress)}
    >
      <div className="flex flex-row justify-center px-2 items-center">
        <div className="flex flex-col">
          <span className="font-inter font-semibold text-sm" style={{ color: '#007AFF' }}>
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
