import React, { memo, useRef, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import { useAppEnv } from 'app/env';
import { useBalanceSelector } from 'app/store/balances/selectors';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/collectibles/selectors';
import { useCollectibleMetadataSelector } from 'app/store/collectibles-metadata/selectors';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { objktCurrencies } from 'lib/apis/objkt';
import { T } from 'lib/i18n';
import { buildObjktCollectibleArtifactUri } from 'lib/images-uri';
import { getAssetName } from 'lib/metadata';
import { atomsToTokens } from 'lib/temple/helpers';
import { Link } from 'lib/woozie';

import { CollectibleItemImage } from './CollectibleItemImage';
import { CollectibleTabSelectors } from './selectors';

interface Props {
  assetSlug: string;
  accountPkh: string;
  chainId: string;
  adultBlur: boolean;
  areDetailsShown: boolean;
  hideWithoutMeta?: boolean;
}

export const CollectibleItem = memo<Props>(
  ({ assetSlug, accountPkh, chainId, adultBlur, areDetailsShown, hideWithoutMeta }) => {
    const { popup } = useAppEnv();
    const metadata = useCollectibleMetadataSelector(assetSlug);
    const wrapperElemRef = useRef<HTMLDivElement>(null);
    const balanceAtomic = useBalanceSelector(accountPkh, chainId, assetSlug);

    const decimals = metadata?.decimals;

    const balance = useMemo(
      () => (isDefined(decimals) && balanceAtomic ? atomsToTokens(balanceAtomic, decimals) : null),
      [balanceAtomic, decimals]
    );

    const areDetailsLoading = useAllCollectiblesDetailsLoadingSelector();
    const details = useCollectibleDetailsSelector(assetSlug);

    const listing = useMemo(() => {
      if (!details?.listing) return null;

      const { floorPrice, currencyId } = details.listing;

      const currency = objktCurrencies[currencyId];

      if (!isDefined(currency)) return null;

      return { floorPrice: atomsToTokens(floorPrice, currency.decimals).toString(), symbol: currency.symbol };
    }, [details?.listing]);

    // Fixed sizes to improve large grid performance
    const [style, imgWrapStyle] = useMemo(() => {
      const size = popup ? 106 : 125;

      const style = popup
        ? {
            width: size,
            height: areDetailsShown ? 152 : size
          }
        : {
            width: size,
            height: areDetailsShown ? 171 : size
          };

      const imgWrapStyle = {
        height: size - 2
      };

      return [style, imgWrapStyle];
    }, [areDetailsShown, popup]);

    if (hideWithoutMeta && !metadata) return null;

    const assetName = getAssetName(metadata);

    return (
      <Link
        to={`/collectible/${assetSlug}`}
        className="flex flex-col border border-gray-300 rounded-lg overflow-hidden"
        style={style}
        testID={CollectibleTabSelectors.collectibleItem}
        testIDProperties={{ assetSlug: assetSlug }}
      >
        <div
          ref={wrapperElemRef}
          className={clsx(
            'relative flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden hover:opacity-70',
            areDetailsShown && 'border-b border-gray-300'
          )}
          style={imgWrapStyle}
          title={assetName}
        >
          <CollectibleItemImage
            assetSlug={assetSlug}
            metadata={metadata}
            extraSrc={details?.objktArtifactUri && buildObjktCollectibleArtifactUri(details?.objktArtifactUri)}
            adultBlur={adultBlur}
            areDetailsLoading={areDetailsLoading && details === undefined}
            mime={details?.mime}
            containerElemRef={wrapperElemRef}
          />

          {areDetailsShown && balance ? (
            <div className="absolute bottom-1.5 left-1.5 text-xxxs text-white leading-none p-1 bg-black bg-opacity-60 rounded">
              {balance.toFixed()}×
            </div>
          ) : null}
        </div>

        {areDetailsShown && (
          <div className="mt-1 mx-1.5">
            <h5 className="text-sm leading-5 text-gray-910 truncate">{assetName}</h5>
            <div
              className="mt-1 text-xxxs leading-3 text-gray-600"
              {...setTestID(CollectibleTabSelectors.collectibleName)}
              {...setAnotherSelector('name', assetName)}
            >
              <span {...setTestID(CollectibleTabSelectors.floorPrice)}>
                <T id="floorPrice" />:{' '}
              </span>

              {isDefined(listing) ? (
                <>
                  <Money shortened smallFractionFont={false} tooltip={true}>
                    {listing.floorPrice}
                  </Money>
                  <span> {listing.symbol}</span>
                </>
              ) : (
                '-'
              )}
            </div>
          </div>
        )}
      </Link>
    );
  }
);
