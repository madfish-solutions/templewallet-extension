import React, { FC, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Identicon, Name, Money, HashChip, ABContainer } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { BakingSectionSelectors } from 'app/pages/Home/OtherComponents/BakingSection/selectors';
import { toLocalFormat, T } from 'lib/i18n';
import { HELP_UKRAINE_BAKER_ADDRESS, RECOMMENDED_BAKER_ADDRESS } from 'lib/known-bakers';
import { useRelevantAccounts, useAccount, useNetwork, useKnownBaker } from 'lib/temple/front';
import { TempleAccount } from 'lib/temple/types';

import { OpenInExplorerChip } from './OpenInExplorerChip';

interface Props {
  bakerPkh: string;
  link?: boolean;
  displayAddress?: boolean;
  className?: string;
}

const BakerBanner = memo<Props>(({ bakerPkh, link = false, displayAddress = false, className }) => {
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

  return (
    <div className={clsx('flex gap-x-2 text-gray-700 border rounded-md p-3', className)}>
      {baker ? (
        <>
          <img src={baker.logo} alt={baker.name} className="flex-shrink-0 w-16 h-16 bg-white rounded shadow-xs" />

          <div className="flex-1 flex flex-col gap-y-2 relative overflow-hidden">
            <div className="flex items-center gap-x-2">
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

              <div className="w-24" />
            </div>

            <div
              className={clsx(
                'flex flex-wrap items-center text-left text-xs leading-tight text-gray-500',
                fullPage && 'gap-x-8'
              )}
            >
              <div className="flex-1 flex flex-col">
                <T id="staking" />:
                <span style={{ marginTop: 2 }} className="text-gray-600 flex">
                  <Money>{(baker.stakingBalance / 1000).toFixed(0)}</Money>K
                </span>
              </div>

              <div className="flex-1 flex flex-col">
                <T id="space" />:
                <span style={{ marginTop: 2 }} className="text-gray-600 flex">
                  <Money>{(baker.freeSpace / 1000).toFixed(0)}</Money>K
                </span>
              </div>

              <div className="flex-1 flex flex-col">
                <T id="fee" />:
                <span style={{ marginTop: 2 }} className="text-gray-600">
                  {toLocalFormat(new BigNumber(baker.fee).times(100), {
                    decimalPlaces: 2
                  })}
                  %
                </span>
              </div>
            </div>

            {link && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center">
                <ChevronRightIcon className="h-5 w-5 stroke-current text-gray-500" />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <Identicon type="bottts" hash={bakerPkh} size={40} className="shadow-xs" />

          <Name className="text-lg leading-none font-medium text-gray-700">
            <BakerAccount account={account} bakerAcc={bakerAcc} bakerPkh={bakerPkh} />
          </Name>
        </>
      )}
    </div>
  );
});

export default BakerBanner;

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

const SponsoredBaker: FC<{ isRecommendedBaker: boolean }> = ({ isRecommendedBaker }) => (
  <div className="flex-shrink-0 font-normal text-xs px-2 py-1 bg-blue-500 text-white" style={{ borderRadius: '10px' }}>
    <T id={isRecommendedBaker ? 'recommended' : 'helpUkraine'} />
  </div>
);

const PromotedBaker: FC<{ isRecommendedBaker: boolean }> = ({ isRecommendedBaker }) => (
  <div
    className="flex-shrink-0 font-normal text-xs px-2 py-1 bg-primary-orange text-white"
    style={{ borderRadius: '10px' }}
  >
    <T id={isRecommendedBaker ? 'recommended' : 'helpUkraine'} />
  </div>
);
