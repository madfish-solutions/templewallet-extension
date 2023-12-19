import React, { FC, HTMLAttributes, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { Identicon, Name, Money, HashChip, ABContainer } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { BakingSectionSelectors } from 'app/pages/Home/OtherComponents/BakingSection.selectors';
import { toLocalFormat, T } from 'lib/i18n';
import { HELP_UKRAINE_BAKER_ADDRESS, RECOMMENDED_BAKER_ADDRESS } from 'lib/known-bakers';
import { useRelevantAccounts, useAccount, useNetwork, useKnownBaker } from 'lib/temple/front';
import { TempleAccount } from 'lib/temple/types';

import { OpenInExplorerChip } from './OpenInExplorerChip';

type BakerBannerProps = HTMLAttributes<HTMLDivElement> & {
  bakerPkh: string;
  link?: boolean;
  displayAddress?: boolean;
};

const BakerBanner = memo<BakerBannerProps>(({ bakerPkh, link = false, displayAddress = false, className, style }) => {
  const allAccounts = useRelevantAccounts();
  const account = useAccount();
  const { popup } = useAppEnv();
  const { data: baker } = useKnownBaker(bakerPkh);

  const bakerAcc = useMemo(
    () => allAccounts.find(acc => acc.publicKeyHash === bakerPkh) ?? null,
    [allAccounts, bakerPkh]
  );

  const isRecommendedBaker = bakerPkh === RECOMMENDED_BAKER_ADDRESS;
  const isHelpUkraineBaker = bakerPkh === HELP_UKRAINE_BAKER_ADDRESS;

  return (
    <div
      className={classNames('w-full', 'border rounded-md', 'p-3', className)}
      style={{
        maxWidth: undefined,
        ...style
      }}
    >
      {baker ? (
        <>
          <div className={classNames('flex items-stretch', 'text-gray-700')}>
            <div>
              <img
                src={baker.logo}
                alt={baker.name}
                className={classNames('flex-shrink-0', 'w-16 h-16', 'bg-white rounded shadow-xs')}
                style={{
                  minHeight: '2rem'
                }}
              />
            </div>

            <div className="flex flex-col items-start flex-1 ml-2 relative">
              <div
                className={classNames(
                  'w-full mb-2 text-lg text-gray-900',
                  'flex flex-wrap items-center',
                  'leading-none'
                )}
              >
                <Name
                  style={{
                    fontSize: '17px',
                    lineHeight: '20px',
                    maxWidth: isHelpUkraineBaker ? (popup ? '5rem' : '8rem') : '12rem'
                  }}
                  testID={BakingSectionSelectors.delegatedBakerName}
                >
                  {baker.name}
                </Name>

                {(isRecommendedBaker || isHelpUkraineBaker) && (
                  <ABContainer
                    groupAComponent={<SponsoredBaker isRecommendedBaker={isRecommendedBaker} />}
                    groupBComponent={<PromotedBaker isRecommendedBaker={isRecommendedBaker} />}
                  />
                )}

                {displayAddress && (
                  <div className="ml-2 flex flex-wrap items-center">
                    <OpenInExplorerChip hash={baker.address} type="account" small alternativeDesign />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center w-full">
                <div className={classNames('flex-1 flex items-start', popup ? (link ? 'mr-3' : 'mr-7') : 'mr-8')}>
                  <div
                    className={classNames('text-xs leading-tight flex', 'text-gray-500 flex-col', 'items-start flex-1')}
                  >
                    <T id="staking" />:
                    <span style={{ marginTop: 2 }} className="text-gray-600 flex">
                      <Money>{(baker.stakingBalance / 1000).toFixed(0)}</Money>K
                    </span>
                  </div>
                </div>
                <div className={classNames('flex-1 flex items-start', popup ? (link ? 'mr-3' : 'mr-7') : 'mr-8')}>
                  <div
                    className={classNames('text-xs leading-tight flex', 'text-gray-500 flex-col', 'items-start flex-1')}
                  >
                    <T id="space" />:
                    <span style={{ marginTop: 2 }} className="text-gray-600 flex">
                      <Money>{(baker.freeSpace / 1000).toFixed(0)}</Money>K
                    </span>
                  </div>
                </div>
                <div className={classNames('flex-1 flex items-start', popup ? 'mr-9' : 'mr-16')}>
                  <div
                    className={classNames('text-xs leading-tight', 'text-gray-500 flex flex-col', 'items-start flex-1')}
                  >
                    <T id="fee" />:
                    <span style={{ marginTop: 2 }} className="text-gray-600">
                      {toLocalFormat(new BigNumber(baker.fee).times(100), {
                        decimalPlaces: 2
                      })}
                      %
                    </span>
                  </div>
                </div>
              </div>
              {link && (
                <div className={classNames('absolute right-0 top-0 bottom-0', 'flex items-center', 'text-gray-500')}>
                  <ChevronRightIcon className="h-5 w-auto stroke-current" />
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className={classNames('flex items-stretch', 'text-gray-700')}>
          <div>
            <Identicon type="bottts" hash={bakerPkh} size={40} className="shadow-xs" />
          </div>

          <div className="flex flex-col items-start flex-1 ml-2">
            <div className={classNames('mb-px w-full', 'flex flex-wrap items-center', 'leading-none')}>
              <Name className="pb-1 mr-1 text-lg font-medium">
                <BakerAccount account={account} bakerAcc={bakerAcc} bakerPkh={bakerPkh} />
              </Name>
            </div>
          </div>
        </div>
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

  return bakerAcc ? (
    <>
      {bakerAcc.name}
      {bakerAcc.publicKeyHash === account.publicKeyHash && (
        <T id="selfComment">
          {message => (
            <>
              {' '}
              <span className="font-light opacity-75">{message}</span>
            </>
          )}
        </T>
      )}
    </>
  ) : network.type === 'dcp' ? (
    <div className="flex">
      <HashChip bgShade={200} rounded="base" className="mr-1" hash={bakerPkh} small textShade={700} />

      <OpenInExplorerChip hash={bakerPkh} type="account" small alternativeDesign />
    </div>
  ) : (
    <T id="unknownBakerTitle">
      {message => <span className="font-normal">{typeof message === 'string' ? message.toLowerCase() : message}</span>}
    </T>
  );
};

const SponsoredBaker: FC<{ isRecommendedBaker: boolean }> = ({ isRecommendedBaker }) => (
  <div
    className={classNames('font-normal text-xs px-2 py-1 bg-blue-500 text-white ml-2')}
    style={{ borderRadius: '10px' }}
  >
    <T id={isRecommendedBaker ? 'recommended' : 'helpUkraine'} />
  </div>
);
const PromotedBaker: FC<{ isRecommendedBaker: boolean }> = ({ isRecommendedBaker }) => (
  <div
    className={classNames('font-normal text-xs px-2 py-1 bg-primary-orange text-white ml-2')}
    style={{ borderRadius: '10px' }}
  >
    <T id={isRecommendedBaker ? 'recommended' : 'helpUkraine'} />
  </div>
);
