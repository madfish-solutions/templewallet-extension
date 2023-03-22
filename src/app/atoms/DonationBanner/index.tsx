import React, { FC } from 'react';

import { Anchor } from 'app/atoms/Anchor';
import { ReactComponent as Ukraine } from 'app/icons/ukraine.svg';
import { T } from 'lib/i18n';

import { DonationBannerSelectors } from './selectors';

export const DonationBanner: FC = () => (
  <Anchor
    className="flex flex-col items-center justify-center"
    style={{
      borderRadius: '4px',
      maxWidth: '100px',
      height: '28px',
      backgroundColor: '#E5F2FF'
    }}
    href="https://donate.tezos.org.ua"
    testID={DonationBannerSelectors.ukraineDonationBanner}
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
  </Anchor>
);
