import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Anchor, IconBase, Identicon, Money, Name } from 'app/atoms';
import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { T, t, toShortened } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { useKnownBaker } from 'lib/temple/front';
import { useBooleanState } from 'lib/ui/hooks';
import { toPercentage } from 'lib/ui/utils';
import { useOnTezosBlock } from 'temple/front';
import { useBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { StakingCard } from './staking-card';

interface PropComponentProps {
  /** Atomic value */
  staked: number;
}

interface BakerCardProps {
  network: TezosNetworkEssentials;
  accountPkh: string;
  bakerPkh: string;
  ActionButton?: React.ComponentType<PropComponentProps>;
  HeaderRight?: React.ComponentType<PropComponentProps>;
  onClick?: SyncFn<string>;
}

export const BakerCard = memo<BakerCardProps>(
  ({ network, accountPkh, bakerPkh, ActionButton, HeaderRight, onClick }) => {
    const { rpcBaseURL, chainId } = network;

    const [hovered, setHovered, setUnhovered] = useBooleanState(false);
    const { data: stakedData, mutate } = useStakedAmount(rpcBaseURL, accountPkh);
    const explorerHref = useBlockExplorerHref(TempleChainKind.Tezos, chainId, 'address', bakerPkh);
    const { data: baker } = useKnownBaker(bakerPkh, network.chainId, true);

    useOnTezosBlock(rpcBaseURL, () => void mutate());

    const { symbol } = getTezosGasMetadata(chainId);

    const stakedAtomic = useMemo(() => stakedData?.toNumber() || 0, [stakedData]);

    const headerRight = useMemo(
      () => HeaderRight && <HeaderRight staked={stakedAtomic} />,
      [HeaderRight, stakedAtomic]
    );

    const bakerAvatar = baker ? (
      <img src={baker.logo} alt={baker.name} className="flex-shrink-0 w-6 h-6 bg-white rounded mr-2" />
    ) : (
      <Identicon type="botttsneutral" hash={bakerPkh} size={24} className="flex-shrink-0 mr-2" />
    );
    const bakerName = <BakerName>{baker ? baker.name : <T id="unknownBakerTitle" />}</BakerName>;

    const feePercentage = useMemo(() => (baker ? toPercentage(baker.delegation.fee) : '---'), [baker]);

    const handleClick = useCallback(() => onClick?.(bakerPkh), [bakerPkh, onClick]);

    return (
      <StakingCard
        className="cursor-pointer"
        onClick={handleClick}
        topInfo={
          <>
            {explorerHref ? (
              <Anchor href={explorerHref} className={clsx('flex items-center', hovered && 'text-secondary')}>
                {bakerAvatar}
                {bakerName}
                {hovered && <IconBase size={12} Icon={OutLinkIcon} className="ml-0.5" />}
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
          baker && (
            <>
              <BakerStatsEntry
                name={t('delegated')}
                value={toShortened(baker.delegation.capacity - baker.delegation.freeSpace)}
              />
              <BakerStatsEntry name={t('space')} value={toShortened(baker.delegation.freeSpace)} />
              <BakerStatsEntry name={t('fee')} value={feePercentage} />
              <BakerStatsEntry
                name={t('minBalance')}
                value={
                  <>
                    <Money smallFractionFont={false}>{baker.delegation.minBalance}</Money> {symbol}
                  </>
                }
              />
            </>
          )
        }
        actions={ActionButton && <ActionButton staked={stakedAtomic} />}
        onMouseEnter={setHovered}
        onMouseLeave={setUnhovered}
      />
    );
  }
);

const BakerName: React.FC<PropsWithChildren> = ({ children }) => (
  <Name className="text-font-medium-bold">{children}</Name>
);

interface BakerStatsEntryProps {
  name: string;
  value: ReactChildren;
}

export const BakerStatsEntry = memo<BakerStatsEntryProps>(({ name, value }) => (
  <div className="flex flex-1 flex-col gap-0.5">
    <span className="text-font-description text-grey-2">{name}:</span>
    <span className="text-font-num-12">{value}</span>
  </div>
));
