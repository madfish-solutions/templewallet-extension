import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { IconBase } from 'app/atoms';
import { Anchor } from 'app/atoms/Anchor';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { useTokenApyRateSelector } from 'app/store/d-apps';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { Link } from 'lib/woozie';
import { ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EarnOffer } from '../config';

const COMMON_ITEM_CLASSNAME =
  'flex items-center justify-between p-3 group rounded-8 bg-white border-0.5 border-lines hover:bg-grey-4';

interface EarnOfferItemProps {
  offer: EarnOffer;
}

export const EarnItem = memo<EarnOfferItemProps>(({ offer }) => {
  const dynamicApyRate = useTokenApyRateSelector(offer.assetSlug);

  const displayYield = useMemo(() => {
    if (dynamicApyRate) {
      const rate = Number(new BigNumber(dynamicApyRate).decimalPlaces(2));

      return <span className="text-font-small-bold text-success">{`${rate}% APY`}</span>;
    }

    if (offer.displayYield) {
      return <span className="text-font-small-bold text-success">{offer.displayYield}</span>;
    }

    return null;
  }, [dynamicApyRate, offer.displayYield]);

  if (offer.isExternal) {
    return (
      <Anchor href={offer.link} className={COMMON_ITEM_CLASSNAME}>
        <EarnOfferItemContent offer={offer} displayYield={displayYield} />
      </Anchor>
    );
  }

  return (
    <Link to={offer.link} className={COMMON_ITEM_CLASSNAME}>
      <EarnOfferItemContent offer={offer} displayYield={displayYield} />
    </Link>
  );
});

interface EarnOfferItemContentProps {
  offer: EarnOffer;
  displayYield: React.ReactNode;
}

const EarnOfferItemContent = memo<EarnOfferItemContentProps>(({ offer, displayYield }) => (
  <>
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 relative">
        {offer.chainKind === TempleChainKind.Tezos ? (
          <TezosAssetIconWithNetwork
            tezosChainId={offer.chainId as ChainId<TempleChainKind.Tezos>}
            assetSlug={offer.assetSlug}
          />
        ) : (
          <EvmAssetIconWithNetwork
            evmChainId={offer.chainId as ChainId<TempleChainKind.EVM>}
            assetSlug={offer.assetSlug}
          />
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-font-description-bold text-secondary">{offer.name}</span>

          {offer.isExternal && (
            <IconBase Icon={OutLinkIcon} size={12} className="text-secondary opacity-0 group-hover:opacity-100" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-font-small text-grey-1">{offer.description}</span>

          {offer.providerIcon && <offer.providerIcon className="w-4 h-4 shrink-0" />}
        </div>
      </div>
    </div>

    {displayYield}
  </>
));
