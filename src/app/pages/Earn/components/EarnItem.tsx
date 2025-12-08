import React, { FC, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { IconBase } from 'app/atoms';
import { Anchor } from 'app/atoms/Anchor';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { useTokenApyRateSelector } from 'app/store/d-apps';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { Link } from 'lib/woozie';
import { ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EarnOffer } from '../types';

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

      return `${rate}% APY`;
    }

    if (offer.displayYield) {
      return offer.displayYield;
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
    <div className="flex items-center gap-x-2">
      <Icon {...offer} />

      <div className="flex flex-col">
        <div className="flex items-center gap-x-0.5">
          <span className="text-font-medium-bold group-hover:text-secondary">{offer.name}</span>

          {offer.isExternal && (
            <IconBase Icon={OutLinkIcon} size={12} className="text-secondary opacity-0 group-hover:opacity-100" />
          )}
        </div>

        <div className="flex items-center gap-x-1">
          <span className="text-font-description text-grey-1">{offer.description}</span>

          {offer.providerIcon && <offer.providerIcon className="w-5 h-5 shrink-0" />}
        </div>
      </div>
    </div>

    <span className="text-font-num-bold-14 text-success">{displayYield}</span>
  </>
));

const Icon: FC<EarnOffer> = ({ chainKind, chainId, assetSlug }) =>
  chainKind === TempleChainKind.Tezos ? (
    <TezosAssetIconWithNetwork tezosChainId={chainId as ChainId<TempleChainKind.Tezos>} assetSlug={assetSlug} />
  ) : (
    <EvmAssetIconWithNetwork evmChainId={chainId as ChainId<TempleChainKind.EVM>} assetSlug={assetSlug} />
  );
