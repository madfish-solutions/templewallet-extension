import React, { HTMLAttributes, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import ABContainer from 'app/atoms/ABContainer';
import Identicon from 'app/atoms/Identicon';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import { useAppEnv } from 'app/env';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { toLocalFormat } from 'lib/i18n/numbers';
import { T } from 'lib/i18n/react';
import { useRelevantAccounts, useAccount, useNetwork, useKnownBaker, useExplorerBaseUrls } from 'lib/temple/front';
import { TempleAccount } from 'lib/temple/types';

import HashChip from './HashChip';

type BakerBannerProps = HTMLAttributes<HTMLDivElement> & {
  bakerPkh: string;
  promoted?: boolean;
  link?: boolean;
  displayAddress?: boolean;
};

const BakerBanner = memo<BakerBannerProps>(
  ({ bakerPkh, link = false, promoted = false, displayAddress = false, className, style }) => {
    const allAccounts = useRelevantAccounts();
    const account = useAccount();
    const { popup } = useAppEnv();
    const { data: baker } = useKnownBaker(bakerPkh);
    const { account: accountBaseUrl } = useExplorerBaseUrls();

    const bakerAcc = useMemo(
      () => allAccounts.find(acc => acc.publicKeyHash === bakerPkh) ?? null,
      [allAccounts, bakerPkh]
    );

    return (
      <div
        className={classNames('w-full', 'border rounded-md', 'p-2', className)}
        style={{
          maxWidth: undefined,
          width: popup ? '100%' : '22.5rem',
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
                    'w-full mb-2 mt-1 text-lg text-gray-900',
                    'flex flex-wrap items-center',
                    'leading-none'
                  )}
                >
                  <Name style={{ fontSize: '17px', lineHeight: '20px' }}>{baker.name}</Name>
                  {promoted && <ABContainer groupAComponent={<SponsoredBaker />} groupBComponent={<PromotedBaker />} />}
                  {displayAddress && (
                    <div className="ml-2 flex flex-wrap items-center">
                      {accountBaseUrl && (
                        <OpenInExplorerChip
                          bgShade={200}
                          textShade={500}
                          rounded="base"
                          hash={baker.address}
                          baseUrl={accountBaseUrl}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center w-full">
                  <div className="flex-1 flex items-start mr-3">
                    <div
                      className={classNames(
                        'text-xs leading-tight flex',
                        'text-gray-500 flex-col',
                        'items-start flex-1'
                      )}
                    >
                      <T id="staking" />:
                      <span className="text-gray-600 flex">
                        <Money>{(baker.stakingBalance / 1000).toFixed(0)}</Money>K
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-start mr-3">
                    <div
                      className={classNames(
                        'text-xs leading-tight flex',
                        'text-gray-500 flex-col',
                        'items-start flex-1'
                      )}
                    >
                      <T id="space" />:
                      <span className="text-gray-600 flex">
                        <Money>{(baker.freeSpace / 1000).toFixed(0)}</Money>K
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-start mr-12">
                    <div
                      className={classNames(
                        'text-xs leading-tight',
                        'text-gray-500 flex flex-col',
                        'items-start flex-1'
                      )}
                    >
                      <T id="fee" />:
                      <span className="text-gray-600">
                        {toLocalFormat(new BigNumber(baker.fee).times(100), {
                          decimalPlaces: 2
                        })}
                        %
                      </span>
                    </div>
                  </div>
                </div>
                {link && (
                  <div
                    className={classNames(
                      'absolute right-0 top-0 bottom-0',
                      'flex items-center',
                      'pr-2',
                      'text-gray-500'
                    )}
                  >
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
                  <BakerAccount
                    account={account}
                    bakerAcc={bakerAcc}
                    bakerPkh={bakerPkh}
                    accountBaseUrl={accountBaseUrl}
                  />
                </Name>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default BakerBanner;

const BakerAccount: React.FC<{
  bakerAcc: TempleAccount | null;
  account: TempleAccount;
  bakerPkh: string;
  accountBaseUrl?: string;
}> = ({ bakerAcc, account, bakerPkh, accountBaseUrl }) => {
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
      {accountBaseUrl && (
        <OpenInExplorerChip bgShade={200} textShade={500} rounded="base" hash={bakerPkh} baseUrl={accountBaseUrl} />
      )}
    </div>
  ) : (
    <T id="unknownBakerTitle">
      {message => <span className="font-normal">{typeof message === 'string' ? message.toLowerCase() : message}</span>}
    </T>
  );
};

const SponsoredBaker = () => (
  <div
    className={classNames('font-normal text-xs px-2 py-1 bg-blue-500 text-white ml-2')}
    style={{ borderRadius: '10px' }}
  >
    <T id="recommended" />
  </div>
);
const PromotedBaker = () => (
  <div
    className={classNames('font-normal text-xs px-2 py-1 bg-primary-orange text-white ml-2')}
    style={{ borderRadius: '10px' }}
  >
    <T id="recommended" />
  </div>
);
