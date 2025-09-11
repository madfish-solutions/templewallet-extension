import React, { memo, useCallback } from 'react';

import browser from 'webextension-polyfill';

import { ReactComponent as DollarRebootIcon } from 'app/icons/base/dollar_reboot.svg';
import { ReactComponent as GiftFillIcon } from 'app/icons/base/gift_fill.svg';
import { ReactComponent as NoLockIcon } from 'app/icons/base/no-lock.svg';
import { ReactComponent as SecurityIcon } from 'app/icons/base/security.svg';
import { EarnPromoAdvantageItem, EarnPromoLayout } from 'app/layouts/EarnPromoLayout';
import { T } from 'lib/i18n';
import { Lottie } from 'lib/ui/react-lottie';

import ethCoinAnimation from './eth-coin-animation.json';
import { EarnEthSelectors } from './selectors';

const EVERSTAKE_ETHEREUM_STAKE_UTM_LINK =
  'https://stake.everstake.one/dashboard/stake/ethereum/?utm_source=Temple_Wallet&utm_medium=partner&utm_campaign=Temple_Wallet_campaign_Q3-25';

const ethCoinAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: ethCoinAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

const advantages: EarnPromoAdvantageItem[] = [
  { Icon: NoLockIcon, textI18nKey: 'nonCustodialStaking' },
  { Icon: DollarRebootIcon, textI18nKey: 'higherRewardsSystem' },
  { Icon: SecurityIcon, textI18nKey: 'verifiedSecurity' },
  { Icon: GiftFillIcon, textI18nKey: 'stakeGetAirdrops' }
];

export const EarnEthPage = memo(() => {
  const handleStakeClick = useCallback(async () => {
    await browser.tabs.create({ url: EVERSTAKE_ETHEREUM_STAKE_UTM_LINK });
  }, []);

  return (
    <EarnPromoLayout
      pageTitle="Earn ETH"
      TopVisual={<Lottie isClickToPauseDisabled options={ethCoinAnimationOptions} height={172} width={172} />}
      headline={<T id="earnEthHeadline" />}
      advantages={advantages}
      advantageIconClassName="text-secondary"
      disclaimer={<T id="earnWithEverstakeDisclaimer" />}
      actionText={<T id="stake" />}
      actionColor="secondary"
      onActionClick={handleStakeClick}
      actionTestID={EarnEthSelectors.stakeButton}
    />
  );
});
