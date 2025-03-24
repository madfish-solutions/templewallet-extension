import React, { memo, useCallback, useMemo } from 'react';

import { LevelInfo } from '@taquito/rpc';
import BigNumber from 'bignumber.js';

import { Alert, Anchor, IconBase, Money } from 'app/atoms';
import { Lottie } from 'app/atoms/react-lottie';
import { StyledButton } from 'app/atoms/StyledButton';
import { Tooltip } from 'app/atoms/Tooltip';
import {
  StakingCyclesInfo,
  useBlockLevelInfo,
  useStakedAmount,
  useStakingCyclesInfo,
  useUnstakeRequests
} from 'app/hooks/use-baking-hooks';
import { useRichFormatTooltip } from 'app/hooks/use-rich-format-tooltip';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { BakerStatsEntry } from 'app/templates/baker-card';
import { StakingCard } from 'app/templates/staking-card';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { t, T, toShortened } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { useKnownBaker } from 'lib/temple/front';
import { mutezToTz } from 'lib/temple/helpers';
import { toPercentage } from 'lib/ui/utils';
import { ZERO } from 'lib/utils/numbers';
import { AccountForTezos } from 'temple/accounts';
import { getTezosToolkitWithSigner, useOnTezosBlock } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

import { stakeChangeForEstimationAmount } from './constants';
import { estimateStaking, isStakingNotAcceptedError } from './estimate-staking';
import unstakePendingAnimation from './unstake-pending-animation.json';
import { useBlockExplorerUrl } from './utils';

interface Props {
  network: TezosNetworkEssentials;
  account: AccountForTezos;
  bakerPkh: string;
  cannotDelegate: boolean;
  openFinalizeModal: EmptyFn;
  openStakeModal: EmptyFn;
  openUnstakeModal: EmptyFn;
}

const pendingRequestAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: unstakePendingAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

export const TezosStakingList = memo<Props>(
  ({ network, account, bakerPkh, cannotDelegate, openFinalizeModal, openStakeModal, openUnstakeModal }) => {
    const { address: accountPkh } = account;
    const { rpcBaseURL, chainId } = network;
    const { data: baker } = useKnownBaker(bakerPkh, network.chainId, true);
    const { symbol } = getTezosGasMetadata(chainId);
    const { data: stakedData, mutate: updateStakedAmount } = useStakedAmount(rpcBaseURL, accountPkh, true);
    const { data: requests, mutate: updateUnstakeRequests } = useUnstakeRequests(rpcBaseURL, accountPkh, true);
    const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);
    const { data: cyclesInfo } = useStakingCyclesInfo(rpcBaseURL);
    const blockLevelInfo = useBlockLevelInfo(rpcBaseURL);
    const blockExplorerUrl = useBlockExplorerUrl(network);
    const pendingRequests = requests?.unfinalizable.requests;
    const readyRequests = requests?.finalizable;

    const getCanStake = useCallback(async () => {
      const tezos = getTezosToolkitWithSigner(rpcBaseURL, account.address);

      try {
        await estimateStaking(account, tezos, tezBalance, stakeChangeForEstimationAmount);

        return true;
      } catch (e) {
        return !isStakingNotAcceptedError(e);
      }
    }, [account, rpcBaseURL, tezBalance]);
    const { data: canStakeFromRpc } = useTypedSWR(
      baker ? null : ['can-stake', accountPkh, rpcBaseURL, bakerPkh],
      getCanStake,
      { suspense: true }
    );
    const canStake = baker?.staking.enabled ?? canStakeFromRpc;

    const staked = useMemo(() => stakedData && stakedData.gt(0), [stakedData]);
    const feePercentage = useMemo(() => (baker ? toPercentage(baker.staking.fee) : '---'), [baker]);
    const estimatedApy = useMemo(() => (baker ? toPercentage(baker.staking.estimatedApy) : '---'), [baker]);

    useOnTezosBlock(rpcBaseURL, () => {
      updateStakedAmount();
      updateUnstakeRequests();
    });

    return (
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-font-description-bold">
            <T id="tezosStaking" />
          </span>

          <Tooltip content={<T id="stakingTooltipText" />} wrapperClassName="max-w-[242px]" className="text-grey-2" />
        </div>
        {canStake ? (
          <StakingCard
            className="mb-4"
            topInfo={
              <div className="flex flex-col gap-0.5">
                <span className="text-font-description text-grey-1">
                  <T id="staked" />
                </span>
                <span className="text-font-medium-bold">
                  {stakedData ? (
                    <>
                      <Money smallFractionFont={false}>{mutezToTz(stakedData)}</Money> {symbol}
                    </>
                  ) : (
                    '---'
                  )}
                </span>
              </div>
            }
            bottomInfo={
              baker && (
                <>
                  <BakerStatsEntry
                    name={t('staking')}
                    value={toShortened(baker.staking.capacity - baker.staking.freeSpace)}
                  />
                  <BakerStatsEntry name={t('space')} value={toShortened(baker.staking.freeSpace)} />
                  <BakerStatsEntry name={t('fee')} value={feePercentage} />
                  <BakerStatsEntry name={t('estimatedApy')} value={estimatedApy} />
                </>
              )
            }
            actions={
              <>
                {staked && (
                  <StyledButton
                    color="primary-low"
                    size="M"
                    className="flex-1"
                    disabled={cannotDelegate}
                    onClick={openUnstakeModal}
                  >
                    <T id="unstake" />
                  </StyledButton>
                )}
                <StyledButton
                  color="primary"
                  size="M"
                  className="flex-1"
                  disabled={cannotDelegate}
                  onClick={openStakeModal}
                >
                  <T id="stake" />
                </StyledButton>
              </>
            }
          />
        ) : (
          <Alert
            className="mb-4"
            type="warning"
            description={
              <div className="flex flex-col gap-0.5">
                <p className="text-font-description-bold">
                  <T id="stakeUnavailableTitle" />
                </p>
                <p className="text-font-description">
                  <T id="stakeUnavailableDescription" />
                </p>
              </div>
            }
          />
        )}
        <div className="flex flex-col gap-3">
          {readyRequests?.map((req, i) => (
            <UnstakeRequestItem
              {...req}
              key={i}
              index={i}
              cyclesInfo={cyclesInfo}
              blockLevelInfo={blockLevelInfo}
              gasTokenSymbol={symbol}
              blockExplorerUrl={blockExplorerUrl}
              openFinalizeModal={openFinalizeModal}
            />
          ))}
          {pendingRequests?.map((req, i) => (
            <UnstakeRequestItem
              {...req}
              key={i}
              index={(readyRequests?.length ?? 0) + i}
              cyclesInfo={cyclesInfo}
              blockLevelInfo={blockLevelInfo}
              gasTokenSymbol={symbol}
              blockExplorerUrl={blockExplorerUrl}
              openFinalizeModal={openFinalizeModal}
            />
          ))}
        </div>
      </div>
    );
  }
);

interface UnstakeRequestItemProps {
  delegate?: string;
  cycle: number;
  amount: BigNumber;
  index: number;
  cyclesInfo: StakingCyclesInfo | null | undefined;
  blockLevelInfo: LevelInfo | undefined;
  gasTokenSymbol: string;
  blockExplorerUrl?: string;
  openFinalizeModal: EmptyFn;
}

const unstakeInProgressTooltipProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  placement: 'bottom-end' as const,
  animation: 'shift-away-subtle'
};

const unstakeInProgressTooltipWrapperFactory = () => {
  const element = document.createElement('div');
  element.className = 'max-w-48';

  return element;
};

const UnstakeRequestItem = memo<UnstakeRequestItemProps>(
  ({
    delegate,
    cycle,
    amount,
    index,
    cyclesInfo,
    blockLevelInfo,
    gasTokenSymbol,
    blockExplorerUrl,
    openFinalizeModal
  }) => {
    const unstakeInProgressLabelRef = useRichFormatTooltip<HTMLDivElement>(
      unstakeInProgressTooltipProps,
      unstakeInProgressTooltipWrapperFactory,
      <T id="unstakeInProgressTooltip" substitutions={cyclesInfo?.cooldownCyclesNumber ?? 4} />
    );

    const endCycle = useMemo(() => {
      if (!cyclesInfo) return;

      return cycle + cyclesInfo.cooldownCyclesNumber - /* Accounting for current cycle*/ 1;
    }, [cycle, cyclesInfo]);

    const cooldownTime = useMemo(() => {
      if (delegate || !cyclesInfo || !blockLevelInfo || endCycle == null) return;

      const { blocks_per_cycle, minimal_block_delay } = cyclesInfo;

      const fullCyclesLeft = endCycle - blockLevelInfo.cycle;
      const blocksLeftInCurrentCycle = blocks_per_cycle - blockLevelInfo.cycle_position;

      const blocksLeft = blocks_per_cycle * fullCyclesLeft + blocksLeftInCurrentCycle;

      const blockDuration = minimal_block_delay?.toNumber() ?? TEZOS_BLOCK_DURATION / 1000;
      const secondsLeft = blocksLeft * blockDuration;

      return Math.round(secondsLeft / 3600);
    }, [cyclesInfo, blockLevelInfo, endCycle, delegate]);

    const cooldownTimeStr = cooldownTime == null ? '---' : `≈ ${cooldownTime}h`;

    return (
      <StakingCard
        topInfo={
          <>
            <span className="text-font-medium-bold">
              <T id="unstakeRequestNumber" substitutions={[index + 1]} />
            </span>
            {delegate ? (
              <StyledButton color="primary" size="S" onClick={openFinalizeModal}>
                <T id="finalize" />
              </StyledButton>
            ) : (
              <div
                className="bg-warning-low py-0.5 pl-1 pr-2 rounded-md flex items-center"
                ref={unstakeInProgressLabelRef}
              >
                <Lottie isClickToPauseDisabled options={pendingRequestAnimationOptions} height={16} width={16} />
                <span className="text-font-small-bold">{cooldownTimeStr}</span>
              </div>
            )}
          </>
        }
        bottomInfo={
          <>
            <div className="flex flex-col gap-0.5">
              <span className="text-font-description text-grey-2">
                <T id="amount" />:
              </span>
              <span className="text-font-num-12">
                <Money smallFractionFont={false}>{mutezToTz(amount)}</Money> {gasTokenSymbol}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-font-description text-grey-2">
                <T id="unstakeCycle" />:
              </span>
              {blockExplorerUrl ? (
                <Anchor className="flex items-center gap-0.5 justify-end" href={`${blockExplorerUrl}/cycles`}>
                  <span className="text-font-num-12">{endCycle}</span>
                  <IconBase size={12} className="text-secondary" Icon={OutLinkIcon} />
                </Anchor>
              ) : (
                <span className="text-font-num-12 text-right">{endCycle}</span>
              )}
            </div>
          </>
        }
      />
    );
  }
);
