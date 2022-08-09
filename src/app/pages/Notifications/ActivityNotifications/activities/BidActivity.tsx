import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';

import Money from '../../../../atoms/Money';
import { useGasToken } from '../../../../hooks/useGasToken';
import HashChip from '../../../../templates/HashChip';
import { ActivityType, BaseBidActivityNotificationInterface } from '../ActivityNotifications.interface';
import { BaseActivity } from './BaseActivity';

interface BidActivityProps extends BaseBidActivityNotificationInterface {
  index: number;
  type: ActivityType.BidMade | ActivityType.BidReceived | ActivityType.BidOutbited;
  bidderAddress?: string;
  topBidAmount?: string;
}

export const BidActivity: FC<BidActivityProps> = props => {
  const { type, bidAmount, actionName, actionUrl, bidderAddress, topBidAmount, marketplaceUrl } = props;

  const { metadata } = useGasToken();

  return (
    <BaseActivity {...props}>
      <span className="flex items-center gap-1 font-inter text-gray-700 text-xs font-normal mb-3">
        <T
          id={
            type === ActivityType.BidMade
              ? 'youMadeBid'
              : type === ActivityType.BidReceived
              ? 'youReceivedBid'
              : 'yourBidWasOutbid'
          }
          substitutions={[
            <span className="flex items-center gap-1">
              <Money smallFractionFont={false}>{bidAmount}</Money>
              <span>{metadata.symbol}</span>
            </span>
          ]}
        />
      </span>
      <div className="flex row mb-2">
        <span className="font-inter text-gray-700 text-xs font-normal mr-2">
          <T id="auction" />
        </span>
        <a href={actionUrl} className="font-inter text-blue-500 text-xs font-normal">
          {actionName}
        </a>
      </div>
      {bidderAddress && (
        <div className="flex row items-center mb-2">
          <span className="font-inter text-gray-700 text-xs font-normal">
            <T id="bidder" />
          </span>
          <HashChip hash={bidderAddress} firstCharsCount={10} lastCharsCount={7} small className="mx-2" />
        </div>
      )}
      {topBidAmount && (
        <div className="flex row items-center font-inter text-gray-700 text-xs font-normal mb-2">
          <T id="topBid" />
          <span className="flex items-center gap-1 mx-2">
            <Money smallFractionFont={false}>{topBidAmount}</Money>
            <span>{metadata.symbol}</span>
          </span>
        </div>
      )}
      <div className={classNames('flex row', type === ActivityType.BidMade ? 'mt-1' : 'mt-4')}>
        <span className="font-inter text-gray-700 text-xs font-normal mr-2">
          <T id="marketplace" />
        </span>
        <a href={marketplaceUrl} className="font-inter text-blue-500 text-xs font-normal">
          {marketplaceUrl.slice(8, -1)}
        </a>
      </div>
    </BaseActivity>
  );
};
