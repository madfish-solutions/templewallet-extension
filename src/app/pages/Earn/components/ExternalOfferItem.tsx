import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useTokenApyRateSelector } from 'app/store/d-apps';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { COMMON_MAINNET_CHAIN_IDS, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

import { EarnOffer } from '../config';

interface ExternalOfferItemProps {
  offer: EarnOffer;
}

export const ExternalOfferItem = memo<ExternalOfferItemProps>(({ offer }) => {
  const dynamicApyRate = useTokenApyRateSelector(offer.assetSlug);

  const handleClick = (e: React.MouseEvent) => {
    if (offer.isExternal) {
      e.preventDefault();
      window.open(offer.link, '_blank', 'noopener,noreferrer');
    }
  };

  const displayYield = useMemo(() => {
    if (dynamicApyRate) {
      const rate = Number(new BigNumber(dynamicApyRate).decimalPlaces(2));
      return <span className="text-font-small-bold text-success">{`${rate}% APY`}</span>;
    }

    return null;
  }, [dynamicApyRate]);

  // Determine if this is a Tezos or EVM asset based on the assetSlug format
  const isEvmAsset = offer.assetSlug.includes('0x') || offer.assetSlug.includes('_');
  const isTezosAsset = !isEvmAsset && offer.assetSlug.startsWith('KT1');

  const assetIcon = useMemo(() => {
    // For now, render a placeholder for assets
    // Later, Youves and Applefarm icons will be added
    if (isTezosAsset) {
      return <TezosAssetIconWithNetwork assetSlug={offer.assetSlug} tezosChainId={TEZOS_MAINNET_CHAIN_ID} />;
    }
    if (isEvmAsset && offer.id === 'applefarm-usdc') {
      // USDC on Etherlink
      return <EvmAssetIconWithNetwork assetSlug={offer.assetSlug} evmChainId={COMMON_MAINNET_CHAIN_IDS.etherlink} />;
    }
    // Default placeholder
    return (
      <div className="w-10 h-10 rounded-full bg-grey-4 flex items-center justify-center">
        <span className="text-font-small-bold text-grey-1">?</span>
      </div>
    );
  }, [offer, isTezosAsset, isEvmAsset]);

  return (
    <a
      href={offer.link}
      onClick={handleClick}
      className="flex items-center justify-between p-3 rounded-8 bg-white hover:bg-grey-4 transition-colors duration-200 border-0.5 border-lines"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{assetIcon}</div>
        <div className="flex flex-col">
          <span className="text-font-description-bold text-secondary">{offer.name}</span>
          <span className="text-font-small text-grey-1">{offer.description}</span>
        </div>
      </div>

      {displayYield}
    </a>
  );
});
