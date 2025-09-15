import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { Divider, IconBase, Money, Loader } from 'app/atoms';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { Logo } from 'app/atoms/Logo';
import { usePartnersPromotionSettings } from 'app/hooks/use-partners-promotion-settings';
import { useReferralLinksSettings } from 'app/hooks/use-referral-links-settings';
import { ReactComponent as InfoIcon } from 'app/icons/base/InfoFill.svg';
import { DelegationModal } from 'app/pages/EarnTez/modals/delegation';
import { TEMPLE_BAKERY_PAYOUT_ADDRESS, TEMPLE_REWARDS_PAYOUT_ADDRESS } from 'app/pages/Rewards/constants';
import { advancedFeaturesInfoTippyProps } from 'app/pages/Rewards/tooltip';
import { fetchTokenTransfers } from 'lib/apis/tzkt/api';
import { PREDEFINED_TOKENS_METADATA } from 'lib/assets/known-tokens';
import { IS_MISES_BROWSER } from 'lib/env';
import { t, T } from 'lib/i18n';
import { TEMPLE_BAKER_ADDRESS } from 'lib/known-bakers';
import { useDelegate } from 'lib/temple/front';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { TempleTezosChainId } from 'lib/temple/types';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';
import { useAccountForTezos, useTezosMainnetChain } from 'temple/front';

export const YourRewardsCards = memo(() => {
  const tezosMainnet = useTezosMainnetChain();
  const account = useAccountForTezos();
  const {
    animatedChevronRef: advancedChevronRef,
    handleHover: handleAdvancedHover,
    handleUnhover: handleAdvancedUnhover
  } = useActivateAnimatedChevron();
  const {
    animatedChevronRef: bakeryChevronRef,
    handleHover: handleBakeryHover,
    handleUnhover: handleBakeryUnhover
  } = useActivateAnimatedChevron();

  const advancedFeaturesInfoRef = useTippy<HTMLDivElement>(advancedFeaturesInfoTippyProps);

  const [isDelegationOpen, setDelegationOpen] = useState(false);

  const openTempleBakerDelegation = useCallback<React.MouseEventHandler<HTMLAnchorElement>>(e => {
    e.preventDefault();
    setDelegationOpen(true);
  }, []);
  const closeDelegation = useCallback(() => setDelegationOpen(false), []);

  const { isEnabled: isAdvertisingEnabled } = usePartnersPromotionSettings();
  const { isEnabled: isReferralLinksEnabled } = useReferralLinksSettings();

  const referralsEnabled = useMemo(() => isReferralLinksEnabled && IS_MISES_BROWSER, [isReferralLinksEnabled]);

  const monthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
  }, []);

  const tkeyRewardsStorageKey = useMemo(
    () => `tkey_rewards_stats:${tezosMainnet.chainId}:${account?.address ?? 'unknown'}:${monthKey}`,
    [tezosMainnet.chainId, account?.address, monthKey]
  );

  const [tkeyStats, setTkeyStats] = usePassiveStorage<null | {
    monthKey: string;
    total: number;
    lastAmount?: number;
  }>(tkeyRewardsStorageKey, null);

  const tkeyMeta = PREDEFINED_TOKENS_METADATA[TempleTezosChainId.Mainnet]?.find(t => t.symbol === 'TKEY');
  const tkeyDecimals = useMemo(() => Number(tkeyMeta?.decimals ?? 18), [tkeyMeta]);

  const [isTkeyLoading, setIsTkeyLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!account || !tkeyMeta) {
        setIsTkeyLoading(false);
        return;
      }
      if (tkeyStats) {
        setIsTkeyLoading(false);
        return;
      }

      try {
        setIsTkeyLoading(true);
        const transfers = await fetchTokenTransfers(TempleTezosChainId.Mainnet, {
          'sort.desc': 'id',
          to: account.address,
          from: TEMPLE_REWARDS_PAYOUT_ADDRESS,
          'token.contract': tkeyMeta.address,
          'token.tokenId': tkeyMeta.id
        });

        const total = transfers.reduce((sum, tr) => sum + Number(tr.amount) / 10 ** tkeyDecimals, 0);
        const lastAmount = transfers[0] ? Number(transfers[0].amount) / 10 ** tkeyDecimals : undefined;

        setTkeyStats({ monthKey, total, lastAmount });
      } catch {
      } finally {
        setIsTkeyLoading(false);
      }
    })();
  }, [account, monthKey, setTkeyStats, tkeyDecimals, tezosMainnet.chainId, tkeyMeta, tkeyStats]);

  const bakeryRewardsStorageKey = useMemo(
    () => `tkey_bakery_rewards_stats:${tezosMainnet.chainId}:${account?.address ?? 'unknown'}:${monthKey}`,
    [tezosMainnet.chainId, account?.address, monthKey]
  );

  const [bakeryStats, setBakeryStats] = usePassiveStorage<null | {
    monthKey: string;
    total: number;
    lastAmount?: number;
  }>(bakeryRewardsStorageKey, null);

  const [isBakeryLoading, setIsBakeryLoading] = useState(false);

  const { data: myBakerPkh } = useDelegate(account?.address ?? '', tezosMainnet, false, true);
  const delegatedToTemple = myBakerPkh === TEMPLE_BAKER_ADDRESS;

  useEffect(() => {
    (async () => {
      if (!account || !tkeyMeta) {
        setIsBakeryLoading(false);
        return;
      }
      if (bakeryStats) {
        setIsBakeryLoading(false);
        return;
      }

      try {
        setIsBakeryLoading(true);
        const transfers = await fetchTokenTransfers(TempleTezosChainId.Mainnet, {
          'sort.desc': 'id',
          to: account.address,
          from: TEMPLE_BAKERY_PAYOUT_ADDRESS,
          'token.contract': tkeyMeta.address,
          'token.tokenId': tkeyMeta.id
        });

        const total = transfers.reduce((sum, tr) => sum + Number(tr.amount) / 10 ** tkeyDecimals, 0);
        const lastAmount = transfers[0] ? Number(transfers[0].amount) / 10 ** tkeyDecimals : undefined;

        setBakeryStats({ monthKey, total, lastAmount });
      } catch {
      } finally {
        setIsBakeryLoading(false);
      }
    })();
  }, [account, monthKey, setBakeryStats, tkeyDecimals, tezosMainnet.chainId, tkeyMeta, bakeryStats]);

  return (
    <div className="flex flex-col">
      <span className="text-font-description-bold mb-3">{t('yourRewards')}</span>
      <div className="rounded-8 shadow-bottom mb-4">
        <Link
          to="/settings/additional-settings"
          className={clsx('p-3 flex items-center justify-between')}
          onMouseEnter={handleAdvancedHover}
          onMouseLeave={handleAdvancedUnhover}
        >
          <span className="text-font-medium-bold">
            <T id="advancedFeatures" />
          </span>
          {!isAdvertisingEnabled && !referralsEnabled ? (
            <AnimatedMenuChevron ref={advancedChevronRef} />
          ) : (
            <IconBase ref={advancedFeaturesInfoRef} size={16} Icon={InfoIcon} className="text-grey-2" />
          )}
        </Link>

        <Divider className="bg-lines" />

        <div className="p-3">
          {isTkeyLoading ? (
            <div className="justify-center flex py-2">
              <Loader size="L" trackVariant="dark" className="text-secondary" />
            </div>
          ) : !isAdvertisingEnabled && !referralsEnabled ? (
            <p className="text-font-description text-grey-1">{t('passivelyEarnTkey')}</p>
          ) : !tkeyStats || tkeyStats.total === 0 ? (
            <div className="justify-center flex py-2">
              <span className="text-font-description text-grey-2 center">{t('noRewardsActivity')}</span>
            </div>
          ) : (
            <div className="text-font-description text-grey-1 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-font-description text-grey-1">{t('allTime')}</span>
                <span className="text-font-num-bold-16 text-text">
                  {tkeyStats.total && (
                    <div className="flex flex-row items-center gap-1">
                      <div className="w-6 h-6 flex justify-center items-center bg-text rounded-full">
                        <Logo type={'icon'} size={14} />
                      </div>
                      <Money cryptoDecimals={2} smallFractionFont={false}>
                        {tkeyStats.total}
                      </Money>
                    </div>
                  )}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-font-description text-grey-1">{t('lastActivity')}</span>
                <span className="text-font-num-bold-16 text-success">
                  {tkeyStats.lastAmount && (
                    <>
                      +
                      <Money cryptoDecimals={2} smallFractionFont={false}>
                        {tkeyStats.lastAmount}
                      </Money>
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-8 shadow-bottom">
        <Link
          to={`/earn-tez/${tezosMainnet.chainId}`}
          className={clsx('p-3 flex items-center justify-between')}
          onMouseEnter={handleBakeryHover}
          onMouseLeave={handleBakeryUnhover}
          onClick={delegatedToTemple ? undefined : openTempleBakerDelegation}
        >
          <span className="text-font-medium-bold">
            <T id="templeBakery" />
          </span>
          <AnimatedMenuChevron ref={bakeryChevronRef} />
        </Link>

        <Divider className="bg-lines" />

        <div className="p-3">
          {isBakeryLoading ? (
            <div className="justify-center flex py-2">
              <Loader size="L" trackVariant="dark" className="text-secondary" />
            </div>
          ) : delegatedToTemple && (!bakeryStats || bakeryStats.total === 0) ? (
            <div className="justify-center flex py-2">
              <span className="text-font-description text-grey-2 center">{t('noDelegationRewards')}</span>
            </div>
          ) : !bakeryStats || bakeryStats.total === 0 ? (
            <p className="text-font-description text-grey-1">
              <T id="delegateTezFunds" substitutions={<span className="text-font-description-bold">5.6% APY</span>} />
            </p>
          ) : (
            <div className="text-font-description text-grey-1 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-font-description text-grey-1">{t('allTime')}</span>
                <span className="text-font-num-bold-16 text-text">
                  <div className="flex flex-row items-center gap-1">
                    <div className="w-6 h-6 flex justify-center items-center bg-text rounded-full">
                      <Logo type={'icon'} size={14} />
                    </div>
                    <Money cryptoDecimals={2} smallFractionFont={false}>
                      {bakeryStats.total}
                    </Money>
                  </div>
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-font-description text-grey-1">{t('lastActivity')}</span>
                <span className="text-font-num-bold-16 text-success">
                  {bakeryStats.lastAmount ? (
                    <>
                      +
                      <Money cryptoDecimals={2} smallFractionFont={false}>
                        {bakeryStats.lastAmount}
                      </Money>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {isDelegationOpen && account && (
        <DelegationModal
          network={tezosMainnet}
          account={account}
          directBakerPkh={TEMPLE_BAKER_ADDRESS}
          onClose={closeDelegation}
        />
      )}
    </div>
  );
});
