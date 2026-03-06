import React, { MouseEventHandler, memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Anchor, IconBase, Money } from 'app/atoms';
import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { StakingCard } from 'app/templates/staking-card';
import { StakingStatsEntry } from 'app/templates/staking-stats-entry';
import { T, t, toShortened } from 'lib/i18n';
import { useTezosGasMetadata } from 'lib/metadata';
import { Baker, useKnownBaker } from 'lib/temple/front';
import { useBooleanState } from 'lib/ui/hooks';
import { toPercentage } from 'lib/ui/utils';
import { useOnTezosBlock } from 'temple/front';
import { useBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { getBakerAddress } from '../utils';

import { BakerAvatar } from './baker-avatar';
import { BakerName } from './baker-name';

interface PropComponentProps {
  /** Atomic value */
  staked: number;
}

interface BakerCardProps {
  className?: string;
  network: TezosNetworkEssentials;
  accountPkh: string;
  baker: string | Baker;
  metricsType?: 'delegation' | 'staking';
  ActionButton?: React.ComponentType<PropComponentProps>;
  HeaderRight?: React.ComponentType<PropComponentProps>;
  onClick?: SyncFn<string | Baker>;
}

export const BakerCard = memo(
  ({
    className,
    network,
    accountPkh,
    ActionButton,
    HeaderRight,
    metricsType = 'delegation',
    baker: bakerOrAddress,
    onClick
  }: BakerCardProps) => {
    const { chainId } = network;

    const [hovered, setHovered, setUnhovered] = useBooleanState(false);
    const { data: stakedData, mutate } = useStakedAmount(network, accountPkh);
    const bakerPkh = getBakerAddress(bakerOrAddress);
    const bakerFromProps = typeof bakerOrAddress === 'object' ? bakerOrAddress : undefined;
    const explorerHref = useBlockExplorerHref(TempleChainKind.Tezos, chainId, 'address', bakerPkh);
    const { data: baker = bakerFromProps } = useKnownBaker(
      bakerFromProps ? null : bakerPkh,
      network.chainId,
      !bakerFromProps
    );

    useOnTezosBlock(network, () => void mutate());

    const { symbol } = useTezosGasMetadata(chainId);

    const stakedAtomic = useMemo(() => stakedData?.toNumber() || 0, [stakedData]);

    const headerRight = useMemo(
      () => HeaderRight && <HeaderRight staked={stakedAtomic} />,
      [HeaderRight, stakedAtomic]
    );

    const bakerAvatar = <BakerAvatar className="mr-2" address={baker?.address} bakerName={baker?.name} />;
    const bakerName = <BakerName>{baker ? baker.name : <T id="unknownBakerTitle" />}</BakerName>;

    const delegationFeePercentage = useMemo(() => toPercentage(baker?.delegation.fee), [baker]);
    const stakingFeePercentage = useMemo(() => toPercentage(baker?.staking.fee), [baker]);
    const stakingApyPercentage = useMemo(() => toPercentage(baker?.staking.estimatedApy), [baker]);

    const handleClick = useCallback(() => {
      onClick?.(baker || bakerOrAddress);
    }, [onClick, baker, bakerOrAddress]);

    const onLinkClick = useCallback<MouseEventHandler<HTMLAnchorElement>>(e => void e.stopPropagation(), []);

    return (
      <StakingCard
        className={clsx(onClick && 'hover:bg-grey-4 cursor-pointer', className)}
        onClick={handleClick}
        topInfo={
          <>
            {explorerHref ? (
              <Anchor
                href={explorerHref}
                className={clsx('flex items-center', hovered && 'text-secondary')}
                onClick={onLinkClick}
                onMouseEnter={setHovered}
                onMouseLeave={setUnhovered}
              >
                {bakerAvatar}
                {bakerName}
                <IconBase size={12} Icon={OutLinkIcon} className={clsx('ml-0.5', !hovered && 'invisible')} />
              </Anchor>
            ) : (
              <div className="flex items-center">
                {bakerAvatar}
                {bakerName}
              </div>
            )}
            {headerRight}
          </>
        }
        bottomInfo={
          metricsType === 'delegation' ? (
            <>
              <StakingStatsEntry
                name={t('delegated')}
                value={baker ? toShortened(baker.delegation.capacity - baker.delegation.freeSpace) : '-'}
              />
              <StakingStatsEntry name={t('space')} value={toShortened(baker?.delegation.freeSpace)} />
              <StakingStatsEntry name={t('fee')} value={delegationFeePercentage} />
              <StakingStatsEntry
                name={t('minBalance')}
                value={
                  baker ? (
                    <>
                      <Money smallFractionFont={false}>{baker.delegation.minBalance}</Money> {symbol}
                    </>
                  ) : (
                    '-'
                  )
                }
              />
            </>
          ) : (
            <>
              <StakingStatsEntry
                name={t('staking')}
                value={baker ? toShortened(baker.staking.capacity - baker.staking.freeSpace) : '-'}
              />
              <StakingStatsEntry name={t('space')} value={toShortened(baker?.staking.freeSpace)} />
              <StakingStatsEntry name={t('fee')} value={stakingFeePercentage} />
              <StakingStatsEntry name={t('estimatedApy')} value={stakingApyPercentage} />
            </>
          )
        }
        actions={ActionButton && <ActionButton staked={stakedAtomic} />}
      />
    );
  }
);
