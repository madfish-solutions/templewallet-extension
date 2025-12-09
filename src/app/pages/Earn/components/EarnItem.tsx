import React, { FC, memo, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { IconBase, Loader } from 'app/atoms';
import { Anchor } from 'app/atoms/Anchor';
import Money from 'app/atoms/Money';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { useTokenApyRateSelector } from 'app/store/d-apps';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import InFiat from 'app/templates/InFiat';
import { T } from 'lib/i18n';
import { Link } from 'lib/woozie';
import { ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { ActiveDeposit, EarnOffer } from '../types';

const COMMON_ITEM_CLASSNAME =
  'p-3 group rounded-8 bg-white border-0.5 border-lines hover:bg-grey-4 transition ease-in-out duration-200';

interface EarnOfferItemProps {
  offer: EarnOffer;
  deposit?: ActiveDeposit;
}

export const EarnItem = memo<EarnOfferItemProps>(({ offer, deposit }) => {
  const dynamicApyRate = useTokenApyRateSelector(offer.assetSlug);

  const adjustedOffer = useMemo(() => {
    let finalDisplayYield = offer.displayYield;

    if (dynamicApyRate) {
      const rate = Number(new BigNumber(dynamicApyRate).decimalPlaces(2));

      finalDisplayYield = `${rate}% APY`;
    }

    return { ...offer, displayYield: finalDisplayYield };
  }, [dynamicApyRate, offer]);

  if (offer.isExternal) {
    return (
      <Anchor href={offer.link} className={COMMON_ITEM_CLASSNAME}>
        <EarnOfferItemContent offer={adjustedOffer} deposit={deposit} />
      </Anchor>
    );
  }

  return (
    <Link to={offer.link} className={COMMON_ITEM_CLASSNAME}>
      <EarnOfferItemContent offer={adjustedOffer} deposit={deposit} />
    </Link>
  );
});

const EarnOfferItemContent = memo<EarnOfferItemProps>(({ offer, deposit }) => (
  <div className="flex flex-col gap-y-2 w-full">
    <div className="flex items-center justify-between gap-x-4">
      <div className="flex items-center gap-x-2">
        <Icon {...offer} />

        <div className="flex flex-col">
          <div className="flex items-center gap-x-0.5">
            <span className="text-font-medium-bold group-hover:text-secondary">{offer.symbol}</span>

            {offer.isExternal && (
              <IconBase Icon={OutLinkIcon} size={12} className="text-secondary opacity-0 group-hover:opacity-100" />
            )}
          </div>

          <div className="flex items-center gap-x-1">
            <span className="text-font-description text-grey-1">{offer.name}</span>

            {offer.providerIcon && <offer.providerIcon className="w-5 h-5 shrink-0" />}
          </div>
        </div>
      </div>

      {offer.displayYield && <span className="text-font-num-bold-14 text-success">{offer.displayYield}</span>}
    </div>

    {deposit && <DepositContent offer={offer} deposit={deposit} />}
  </div>
));

const DepositContent = memo<Required<EarnOfferItemProps>>(({ offer, deposit }) => (
  <>
    <div className="border-b-0.5 bg-lines" />

    <div className="flex items-center justify-between px-1 py-2">
      <span className="text-font-description text-grey-1">
        <T id="balance" />
      </span>

      {deposit.isLoading || !isDefined(deposit.amount) ? (
        <Loader size="S" trackVariant="dark" className="text-secondary" />
      ) : (
        <div className="flex items-center gap-x-2 text-right">
          <span className="flex items-center text-font-num-12 gap-x-1">
            <Money smallFractionFont={false} tooltipPlacement="bottom">
              {deposit.amount}
            </Money>
            {offer.symbol}
          </span>

          <InFiat
            chainId={offer.chainId}
            assetSlug={offer.assetSlug}
            volume={deposit.amount}
            smallFractionFont={false}
            showLessThanSign
            roundingMode={BigNumber.ROUND_FLOOR}
            evm={offer.chainKind === TempleChainKind.EVM}
          >
            {({ balance, symbol }) => (
              <span className="flex items-center text-font-num-12 text-grey-1 gap-x-0.5">
                {balance} {symbol}
              </span>
            )}
          </InFiat>
        </div>
      )}
    </div>
  </>
));

const Icon: FC<EarnOffer> = ({ chainKind, chainId, assetSlug }) =>
  chainKind === TempleChainKind.Tezos ? (
    <TezosAssetIconWithNetwork tezosChainId={chainId as ChainId<TempleChainKind.Tezos>} assetSlug={assetSlug} />
  ) : (
    <EvmAssetIconWithNetwork evmChainId={chainId as ChainId<TempleChainKind.EVM>} assetSlug={assetSlug} />
  );
