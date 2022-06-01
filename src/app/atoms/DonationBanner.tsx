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
        border: '1px solid #EA2424',
        borderRadius: '4px',
        maxWidth: '360px'
      }}
      href="https://donate.tezos.org.ua"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('UkraineDonation', AnalyticsEventCategory.ButtonPress)}
    >
      <div className="flex flex-row justify-center">
        <div className="mr-4 my-auto">
          <Ukraine />
        </div>
        <div className="flex flex-col">
          <span className="font-inter font-semibold" style={{ fontSize: '17px' }}>
            <T id={'standWithUkraine'} />
          </span>
        </div>
      </div>
    </a>
  );
};
