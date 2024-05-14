import React, { memo } from 'react';

import { Anchor } from 'app/atoms/Anchor';
import { ReactComponent as Ukraine } from 'app/icons/ukraine.svg';
import { T } from 'lib/i18n';

import { DonationBannerSelectors } from './selectors';

const DONATE_MAD_FISH_URL = 'https://donate.mad.fish';

export const DonationBanner = memo(() => (
  <Anchor
    className="flex items-center rounded h-7 bg-blue-150 max-w-25 px-2"
    href={DONATE_MAD_FISH_URL}
    testID={DonationBannerSelectors.ukraineDonationBanner}
  >
    <span className="font-inter font-semibold mr-3 text-sm text-blue-650">
      <T id="support" />
    </span>

    <Ukraine />
  </Anchor>
));
