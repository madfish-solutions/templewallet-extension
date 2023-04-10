import React, { FC } from 'react';

import { Anchor } from 'app/atoms/Anchor';
import { ReactComponent as Ukraine } from 'app/icons/ukraine.svg';
import { T } from 'lib/i18n';

import { DonationBannerSelectors } from './selectors';

export const DonationBanner: FC = () => (
  <Anchor
    className="flex flex-col items-center justify-center rounded h-7 bg-blue-150 max-w-100"
    href="https://donate.mad.fish"
    testID={DonationBannerSelectors.ukraineDonationBanner}
  >
    <div className="flex flex-row justify-center px-2 items-center">
      <div className="flex flex-col">
        <span className="font-inter font-semibold text-sm text-blue-650">
          <T id={'support'} />
        </span>
      </div>
      <div className="ml-1">
        <Ukraine />
      </div>
    </div>
  </Anchor>
);
