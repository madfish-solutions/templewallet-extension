import React, { FC } from 'react';

import { T } from 'lib/i18n/react';

import Money from '../../../../atoms/Money';
import { useGasToken } from '../../../../hooks/useGasToken';
import HashChip from '../../../../templates/HashChip';
import { ActivityType, BaseCollectibleActivityNotificationInterface } from '../ActivityNotifications.interface';
import { BaseActivity } from './BaseActivity';

interface CollectibleActivityProps extends BaseCollectibleActivityNotificationInterface {
  index: number;
  type:
    | ActivityType.CollectibleSold
    | ActivityType.CollectiblePurchased
    | ActivityType.CollectibleResold
    | ActivityType.CollectibleSellOffer;
  transactionAmount?: string;
  buyerAddress?: string;
  sellerAddress?: string;
  royaltyAmount?: string;
  offerAmount?: string;
  offerAddress?: string;
}

export const CollectibleActivity: FC<CollectibleActivityProps> = props => {
  const {
    type,
    buyerAddress,
    sellerAddress,
    creatorAddress,
    offerAddress,
    marketplaceUrl,
    collectibleName,
    collectibleMarketplaceUrl,
    transactionAmount,
    royaltyAmount,
    offerAmount
  } = props;

  const { metadata } = useGasToken();

  return (
    <BaseActivity {...props}>
      {transactionAmount && (
        <>
          <span className="font-inter text-gray-700 text-xs font-normal mb-1">
            <T
              id={type === ActivityType.CollectibleSold ? 'youSoldNft' : 'youBoughtNft'}
              substitutions={[
                <a href={collectibleMarketplaceUrl} className="font-inter text-blue-500 text-xs font-normal">
                  {collectibleName}
                </a>
              ]}
            />
          </span>
          <span className="flex items-center gap-1 font-inter text-gray-700 text-xs font-normal mb-3">
            <T
              id={type === ActivityType.CollectibleSold ? 'youReceived' : 'youSent'}
              substitutions={[
                <span className="flex items-center gap-1">
                  <Money smallFractionFont={false}>{transactionAmount}</Money>
                  <span>{metadata.symbol}</span>
                </span>
              ]}
            />
          </span>
        </>
      )}
      {royaltyAmount && (
        <>
          <span className="font-inter text-gray-700 text-xs font-normal mb-1">
            <T
              id="nftWasResold"
              substitutions={[
                <a href={collectibleMarketplaceUrl} className="font-inter text-blue-500 text-xs font-normal">
                  {collectibleName}
                </a>
              ]}
            />
          </span>
          <span className="flex items-center gap-1 font-inter text-gray-700 text-xs font-normal mb-3">
            <T
              id="yourRoyalty"
              substitutions={[
                <span className="flex items-center gap-1">
                  <Money smallFractionFont={false}>{royaltyAmount}</Money>
                  <span>{metadata.symbol}</span>
                </span>
              ]}
            />
          </span>
        </>
      )}
      {offerAmount && (
        <div className="mb-3">
          <span className="flex items-center gap-1 font-inter text-gray-700 text-xs font-normal mb-1">
            <T
              id="youReceivedAnOffer"
              substitutions={[
                <span className="flex items-center gap-1">
                  <Money smallFractionFont={false}>{offerAmount}</Money>
                  <span>{metadata.symbol}</span>
                </span>
              ]}
            />
          </span>
          <span className="font-inter text-gray-700 text-xs font-normal">
            <T
              id="onNft"
              substitutions={[
                <a href={collectibleMarketplaceUrl} className="font-inter text-blue-500 text-xs font-normal">
                  {collectibleName}
                </a>
              ]}
            />
          </span>
        </div>
      )}
      {buyerAddress && (
        <div className="flex row items-center mb-2">
          <span className="font-inter text-gray-700 text-xs font-normal">
            <T id="buyer" />
          </span>
          <HashChip hash={buyerAddress} firstCharsCount={10} lastCharsCount={7} small className="mx-2" />
        </div>
      )}
      {sellerAddress && (
        <div className="flex row items-center mb-2">
          <span className="font-inter text-gray-700 text-xs font-normal">
            <T id="seller" />
          </span>
          <HashChip hash={sellerAddress} firstCharsCount={10} lastCharsCount={7} small className="mx-2" />
        </div>
      )}
      {creatorAddress && (
        <div className="flex row items-center mb-2">
          <span className="font-inter text-gray-700 text-xs font-normal">
            <T id="creator" />
          </span>
          <HashChip hash={creatorAddress} firstCharsCount={10} lastCharsCount={7} small className="mx-2" />
        </div>
      )}
      {offerAddress && (
        <div className="flex row items-center mb-2">
          <span className="font-inter text-gray-700 text-xs font-normal">
            <T id="offerer" />
          </span>
          <HashChip hash={offerAddress} firstCharsCount={10} lastCharsCount={7} small className="mx-2" />
        </div>
      )}
      <div className="flex row mt-4">
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
