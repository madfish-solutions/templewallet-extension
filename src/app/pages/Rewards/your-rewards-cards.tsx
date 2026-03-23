import { memo, useCallback, useEffect, useMemo, useState, useTransition } from 'react';

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
import { DISABLE_ADS, IS_MISES_BROWSER } from 'lib/env';
import { t, T } from 'lib/i18n';
import { TEMPLE_BAKER_ADDRESS } from 'lib/known-bakers';
import { useDelegate } from 'lib/temple/front';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { TempleTezosChainId } from 'lib/temple/types';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import useTippy from 'lib/ui/useTippy';
import { Link, navigate } from 'lib/woozie';
import { useAccountForTezos, useTezosMainnetChain } from 'temple/front';
import { confirmTezosOperation, getTezosReadOnlyRpcClient } from 'temple/tezos';

export const YourRewardsCards = memo(() => {
  const tezosMainnet = useTezosMainnetChain();
  const account = useAccountForTezos();
  const hasTezosAccount = Boolean(account);

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

  const [isTkeyLoading, startTkeyLoading] = useTransition();

  useEffect(() => {
    if (!account || !tkeyMeta || tkeyStats) {
      return;
    }

    startTkeyLoading(async () => {
      try {
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
      } catch (err) {
        console.log('Failed to load Tkey stats: ', err);
      }
    });
  }, [account, monthKey, setTkeyStats, startTkeyLoading, tkeyDecimals, tezosMainnet.chainId, tkeyMeta, tkeyStats]);

  const bakeryRewardsStorageKey = useMemo(
    () => `tkey_bakery_rewards_stats:${tezosMainnet.chainId}:${account?.address ?? 'unknown'}:${monthKey}`,
    [tezosMainnet.chainId, account?.address, monthKey]
  );

  const [bakeryStats, setBakeryStats] = usePassiveStorage<null | {
    monthKey: string;
    total: number;
    lastAmount?: number;
  }>(bakeryRewardsStorageKey, null);

  const [isBakeryLoading, startBakeryLoading] = useTransition();
  const [isDelegating, startDelegation] = useTransition();

  const { data: myBakerPkh, mutate: updateBakerPkh } = useDelegate(account?.address ?? '', tezosMainnet, false, true);
  const delegatedToTemple = myBakerPkh === TEMPLE_BAKER_ADDRESS;

  useEffect(() => {
    if (!account || !tkeyMeta || bakeryStats) {
      return;
    }

    startBakeryLoading(async () => {
      try {
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
      } catch (err) {
        console.error('Failed to load bakery stats: ', err);
      }
    });
  }, [
    account,
    bakeryStats,
    monthKey,
    setBakeryStats,
    startBakeryLoading,
    tkeyDecimals,
    tezosMainnet.chainId,
    tkeyMeta
  ]);

  const handleDelegationSuccess = useCallback(
    (opHash: string) => {
      startDelegation(async () => {
        try {
          await confirmTezosOperation(getTezosReadOnlyRpcClient(tezosMainnet), opHash, 2);
          await updateBakerPkh();
        } catch (err) {
          console.error('Failed to confirm successful delegation: ', err);
        }
      });
    },
    [startDelegation, tezosMainnet, updateBakerPkh]
  );

  const handleEarnTezClick = useCallback(() => {
    if (isDelegating) return;
    if (!delegatedToTemple) {
      setDelegationOpen(true);
      return;
    }
    navigate(`/earn-tez/${tezosMainnet.chainId}`);
  }, [delegatedToTemple, isDelegating, tezosMainnet.chainId]);

  return (
    <div className="flex flex-col">
      <span className="text-font-description-bold mb-3">{t('yourRewards')}</span>
      <div className="rounded-8 mb-4 bg-white border-0.5 border-lines">
        {!DISABLE_ADS && (
          <>
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
          </>
        )}

        <div className="p-3">
          {isTkeyLoading ? (
            <div className="justify-center items-center flex h-[42px]">
              <Loader size="L" trackVariant="dark" className="text-secondary" />
            </div>
          ) : !isAdvertisingEnabled && !referralsEnabled && !DISABLE_ADS ? (
            <p className="text-font-description text-grey-1">{t('passivelyEarnTkey')}</p>
          ) : !tkeyStats || tkeyStats.total === 0 ? (
            <div className="justify-center items-center flex h-[42px]">
              <span className="text-font-description text-grey-2 center">{t('noRewardsActivity')}</span>
            </div>
          ) : (
            <div className="text-font-description text-grey-1 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
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
              <div className="flex flex-col items-end gap-0.5">
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
      {hasTezosAccount && (
        <>
          <div className="rounded-8 bg-white border-0.5 border-lines">
            <div
              className={clsx('p-3 flex items-center justify-between', !isDelegating && 'cursor-pointer')}
              onMouseEnter={handleBakeryHover}
              onMouseLeave={handleBakeryUnhover}
              onClick={handleEarnTezClick}
            >
              <span className="text-font-medium-bold">
                <T id="templeBakery" />
              </span>
              {isDelegating ? (
                <div className="flex items-center justify-between p-1">
                  <Loader size="S" trackVariant="dark" className="text-secondary" />
                </div>
              ) : (
                <AnimatedMenuChevron ref={bakeryChevronRef} />
              )}
            </div>

            <Divider className="bg-lines" />

            <div className="p-3">
              {isBakeryLoading ? (
                <div className="justify-center items-center flex h-[42px]">
                  <Loader size="L" trackVariant="dark" className="text-secondary" />
                </div>
              ) : delegatedToTemple && (!bakeryStats || bakeryStats.total === 0) ? (
                <div className="justify-center items-center flex h-[42px]">
                  <span className="text-font-description text-grey-2 center">{t('noDelegationRewards')}</span>
                </div>
              ) : !bakeryStats || bakeryStats.total === 0 ? (
                <p className="text-font-description text-grey-1">
                  <T
                    id="delegateTezFunds"
                    substitutions={<span className="text-font-description-bold">5.6% APY</span>}
                  />
                </p>
              ) : (
                <div className="text-font-description text-grey-1 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
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
                  <div className="flex flex-col items-end gap-0.5">
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
              onDelegationSuccess={handleDelegationSuccess}
              onClose={closeDelegation}
            />
          )}
        </>
      )}
    </div>
  );
});
