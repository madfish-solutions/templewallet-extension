import React, { FC, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Identicon, Name, Money, HashChip, ABContainer, Divider } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { BakingSectionSelectors } from 'app/pages/Home/OtherComponents/BakingSection/selectors';
import { toLocalFormat, T } from 'lib/i18n';
import { HELP_UKRAINE_BAKER_ADDRESS, RECOMMENDED_BAKER_ADDRESS } from 'lib/known-bakers';
import { TEZOS_METADATA } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { useRelevantAccounts, useAccount, useNetwork, useKnownBaker, useTezos } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleAccount } from 'lib/temple/types';

import { OpenInExplorerChip } from './OpenInExplorerChip';

interface Props {
  bakerPkh: string;
  displayAddress?: boolean;
  className?: string;
  HeaderRight?: React.ComponentType;
}

export const BakerCard = memo<Props>(({ bakerPkh, displayAddress = false, className, HeaderRight }) => {
  const allAccounts = useRelevantAccounts();
  const account = useAccount();
  const { fullPage } = useAppEnv();
  const { data: baker } = useKnownBaker(bakerPkh);

  const bakerAcc = useMemo(
    () => allAccounts.find(acc => acc.publicKeyHash === bakerPkh) ?? null,
    [allAccounts, bakerPkh]
  );

  const isRecommendedBaker = bakerPkh === RECOMMENDED_BAKER_ADDRESS;
  const isHelpUkraineBaker = bakerPkh === HELP_UKRAINE_BAKER_ADDRESS;

  if (!baker)
    return (
      <div className={clsx('flex gap-x-2', className)}>
        <Identicon type="bottts" hash={bakerPkh} size={40} className="shadow-xs" />

        <Name className="text-lg leading-none font-medium text-gray-700">
          <BakerAccount account={account} bakerAcc={bakerAcc} bakerPkh={bakerPkh} />
        </Name>
      </div>
    );

  return (
    <div className={clsx('flex flex-col gap-y-4 text-gray-700', className)}>
      <div className="flex items-center gap-x-2">
        <img src={baker.logo} alt={baker.name} className="flex-shrink-0 w-8 h-8 bg-white rounded shadow-xs" />

        <Name className="text-ulg leading-5 text-gray-900" testID={BakingSectionSelectors.delegatedBakerName}>
          {baker.name}
        </Name>

        {(isRecommendedBaker || isHelpUkraineBaker) && (
          <ABContainer
            groupAComponent={<SponsoredBaker isRecommendedBaker={isRecommendedBaker} />}
            groupBComponent={<PromotedBaker isRecommendedBaker={isRecommendedBaker} />}
          />
        )}

        {displayAddress && (
          <div className="flex flex-wrap items-center">
            <OpenInExplorerChip hash={baker.address} type="account" small alternativeDesign />
          </div>
        )}

        <div className="flex-1 min-w-16 flex justify-end">{HeaderRight && <HeaderRight />}</div>
      </div>

      <div
        className={clsx('flex flex-wrap items-center text-left text-xs leading-5 text-gray-500', fullPage && 'gap-x-8')}
      >
        <div className="flex-1 flex flex-col gap-y-1">
          <T id="staking" />:
          <span className="font-medium leading-none text-blue-750">
            <Money>{(baker.stakingBalance / 1000).toFixed(0)}</Money>K
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-y-1">
          <T id="space" />:
          <span className="font-medium leading-none text-blue-750">
            <Money>{(baker.freeSpace / 1000).toFixed(0)}</Money>K
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-y-1">
          <T id="fee" />:
          <span className="font-medium leading-none text-blue-750">
            {toLocalFormat(new BigNumber(baker.fee).times(100), {
              decimalPlaces: 2
            })}
            %
          </span>
        </div>
      </div>
    </div>
  );
});

export const BAKER_BANNER_CLASSNAME = 'p-4 rounded-lg border';

interface BakerBannerProps {
  bakerPkh: string;
  ActionButton?: React.ComponentType<{ staked: number }>;
  HeaderRight?: React.ComponentType;
  allowDisplayZeroStake?: boolean;
}

export const BakerBanner = memo<BakerBannerProps>(({ bakerPkh, ActionButton, HeaderRight, allowDisplayZeroStake }) => {
  const acc = useAccount();
  const tezos = useTezos();

  const { data: stakedData } = useRetryableSWR(
    ['delegate-stake', 'get-staked', tezos.checksum],
    () => tezos.rpc.getStakedBalance(acc.publicKeyHash),
    {
      suspense: true
    }
  );

  console.log('STAKED DATA:', stakedData?.toString());

  const staked = stakedData && stakedData.gt(0) ? atomsToTokens(stakedData, TEZOS_METADATA.decimals) : null;
  const stakedAtomic = stakedData?.toNumber() || 0;

  const displayingStaked = allowDisplayZeroStake || staked?.gt(0) || false;

  return (
    <div className={clsx(BAKER_BANNER_CLASSNAME, 'flex flex-col gap-y-4')}>
      <BakerCard displayAddress bakerPkh={bakerPkh} HeaderRight={HeaderRight} />

      {(ActionButton || displayingStaked) && <Divider />}

      {displayingStaked && (
        <div className="text-sm text-blue-750">
          <span className="mr-1">Staked:</span>

          <span className="font-semibold">
            {staked ? (
              <Money smallFractionFont={false} cryptoDecimals={TEZOS_METADATA.decimals}>
                {staked}
              </Money>
            ) : (
              '0.00'
            )}

            {' ' + TEZOS_METADATA.symbol}
          </span>
        </div>
      )}

      {ActionButton && <ActionButton staked={stakedAtomic} />}
    </div>
  );
});

const BakerAccount: React.FC<{
  bakerAcc: TempleAccount | null;
  account: TempleAccount;
  bakerPkh: string;
}> = ({ bakerAcc, account, bakerPkh }) => {
  const network = useNetwork();

  if (bakerAcc)
    return (
      <>
        {bakerAcc.name}

        {bakerAcc.publicKeyHash === account.publicKeyHash && (
          <>
            {' '}
            <span className="font-light opacity-75">
              <T id="selfComment" />
            </span>
          </>
        )}
      </>
    );

  if (network.type === 'dcp')
    return (
      <div className="flex gap-x-1">
        <HashChip bgShade={200} rounded="base" hash={bakerPkh} small textShade={700} />

        <OpenInExplorerChip hash={bakerPkh} type="account" small alternativeDesign />
      </div>
    );

  return <T id="unknownBakerTitle" />;
};

const BAKER_TAG_CLASSNAME = 'flex-shrink-0 font-medium text-xs leading-none px-2 py-1 text-white rounded-full';

const SponsoredBaker: FC<{ isRecommendedBaker: boolean }> = ({ isRecommendedBaker }) => (
  <div className={clsx(BAKER_TAG_CLASSNAME, 'bg-blue-500')}>
    <T id={isRecommendedBaker ? 'recommended' : 'helpUkraine'} />
  </div>
);

const PromotedBaker: FC<{ isRecommendedBaker: boolean }> = ({ isRecommendedBaker }) => (
  <div className={clsx(BAKER_TAG_CLASSNAME, 'bg-primary-orange')}>
    <T id={isRecommendedBaker ? 'recommended' : 'helpUkraine'} />
  </div>
);
