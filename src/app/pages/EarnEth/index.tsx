import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { getEthAccountTransactions, getEthValidatorsQueueStats } from '@temple-wallet/everstake-wallet-sdk';

import { ReactComponent as DollarRebootIcon } from 'app/icons/base/dollar_reboot.svg';
import { ReactComponent as GiftFillIcon } from 'app/icons/base/gift_fill.svg';
import { ReactComponent as NoLockIcon } from 'app/icons/base/no-lock.svg';
import { ReactComponent as SecurityIcon } from 'app/icons/base/security.svg';
import { EarnPromoAdvantageItem, EarnPromoLayout } from 'app/layouts/EarnPromoLayout';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { getEvmNewBlockListener } from 'lib/evm/on-chain/evm-transfer-subscriptions/evm-new-block-listener';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { Lottie } from 'lib/ui/react-lottie';
import { useAccountAddressForEvm, useAllEvmChains } from 'temple/front';

import { ClaimModal } from './claim-modal';
import { ETH_COIN_ANIMATION_OPTIONS } from './constants';
import { EarnEthPageLayout } from './layout';
import { EarnEthSelectors } from './selectors';
import { StakingModal } from './staking-modal';
import { EthStakingStats } from './types';
import { UnstakeModal } from './unstake-modal';
import { makeEthereumToolkit } from './utils';

const advantages: EarnPromoAdvantageItem[] = [
  { Icon: NoLockIcon, textI18nKey: 'nonCustodialStaking' },
  { Icon: DollarRebootIcon, textI18nKey: 'higherRewardsSystem' },
  { Icon: SecurityIcon, textI18nKey: 'verifiedSecurity' },
  { Icon: GiftFillIcon, textI18nKey: 'stakeGetAirdrops' }
];

const someStakeActivity = ({
  autocompoundBalanceOf,
  depositedBalanceOf,
  pendingBalanceOf,
  pendingDepositedBalanceOf,
  pendingRestakedRewardOf,
  restakedRewardOf,
  withdrawRequest
}: EthStakingStats) =>
  [
    autocompoundBalanceOf,
    depositedBalanceOf,
    pendingBalanceOf,
    pendingDepositedBalanceOf,
    pendingRestakedRewardOf,
    restakedRewardOf,
    withdrawRequest.readyForClaim,
    withdrawRequest.requested
  ].some(value => value.gt(0));

enum EarnEthPageContentModal {
  Stake = 'stake',
  Unstake = 'unstake',
  Claim = 'claim'
}

const modals = {
  [EarnEthPageContentModal.Stake]: StakingModal,
  [EarnEthPageContentModal.Unstake]: UnstakeModal,
  [EarnEthPageContentModal.Claim]: ClaimModal
};

export const EarnEthPage = memo(() => {
  const isTestnet = useTestnetModeEnabledSelector();
  const evmAddress = useAccountAddressForEvm();
  const allEvmChains = useAllEvmChains();
  const chain = allEvmChains[isTestnet ? ETHEREUM_HOODI_CHAIN_ID : ETHEREUM_MAINNET_CHAIN_ID];
  const stakingEthereum = useMemo(() => (chain && !chain.disabled ? makeEthereumToolkit(chain) : null), [chain]);

  const [currentModal, setCurrentModal] = useState<EarnEthPageContentModal | null>(null);
  const openModalFactory = useCallback((modal: EarnEthPageContentModal) => () => setCurrentModal(modal), []);
  const closeCurrentModal = useCallback(() => setCurrentModal(null), []);
  const openStakeModal = useMemo(() => openModalFactory(EarnEthPageContentModal.Stake), [openModalFactory]);
  const openUnstakeModal = useMemo(() => openModalFactory(EarnEthPageContentModal.Unstake), [openModalFactory]);
  const openClaimModal = useMemo(() => openModalFactory(EarnEthPageContentModal.Claim), [openModalFactory]);
  const Modal = currentModal && modals[currentModal];

  const getStats = useCallback(async () => {
    if (!evmAddress || !stakingEthereum) return null;

    const [contractViewsStats, validatorsQueueStats, [lastUnstakeTransaction]] = await Promise.all([
      stakingEthereum.contractViewsStats(evmAddress),
      getEthValidatorsQueueStats(),
      getEthAccountTransactions({ account: evmAddress, operation: 'unstake', limit: 1 })
    ]);

    return { ...contractViewsStats, ...validatorsQueueStats, lastUnstakeTimestamp: lastUnstakeTransaction?.created_at };
  }, [stakingEthereum, evmAddress]);
  const {
    data: stats,
    mutate: updateStats,
    isValidating
  } = useTypedSWR(['eth-staking-balances', evmAddress, chain?.chainId], getStats, {
    suspense: true,
    revalidateOnFocus: false
  });
  const isValidatingRef = useUpdatableRef(isValidating);
  const blockListener = useMemo(() => (chain && !chain.disabled ? getEvmNewBlockListener(chain) : null), [chain]);
  useEffect(() => {
    if (!blockListener) return;

    const listenFn = () => {
      !isValidatingRef.current && updateStats();
    };

    blockListener.subscribe(listenFn);

    return () => blockListener.unsubscribe(listenFn);
  }, [blockListener, updateStats, isValidatingRef]);

  return (
    <>
      {stats && someStakeActivity(stats) ? (
        <EarnEthPageLayout
          chain={chain}
          stats={stats}
          openUnstakeModal={openUnstakeModal}
          openStakeModal={openStakeModal}
          openClaimModal={openClaimModal}
        />
      ) : (
        <EarnPromoLayout
          pageTitle="Earn ETH"
          TopVisual={<Lottie isClickToPauseDisabled options={ETH_COIN_ANIMATION_OPTIONS} height={172} width={172} />}
          headline={<T id="earnEthHeadline" />}
          advantages={advantages}
          advantageIconClassName="text-secondary"
          disclaimer={<T id="earnWithEverstakeDisclaimer" />}
          actionText={
            stakingEthereum ? (
              <T id="stake" />
            ) : (
              <T
                id={chain ? 'enableNetworkToContinue' : 'addNetworkToContinue'}
                substitutions={isTestnet ? 'Ethereum Hoodi' : 'Ethereum'}
              />
            )
          }
          actionDisabled={!stakingEthereum}
          actionColor="secondary"
          onActionClick={openStakeModal}
          actionTestID={EarnEthSelectors.stakeButton}
        />
      )}

      {stats && Modal && <Modal chain={chain} stats={stats} onRequestClose={closeCurrentModal} />}
    </>
  );
});
