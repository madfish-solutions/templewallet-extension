import React, { FC, useCallback, useRef, useState, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import { useAppEnv } from 'app/env';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/collectibles/selectors';
import { useTokenMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { objktCurrencies } from 'lib/apis/objkt';
import { T } from 'lib/i18n';
import { getAssetName } from 'lib/metadata';
import { useBalance } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link } from 'lib/woozie';

import { CollectibleItemImage } from './CollectibleItemImage';

interface Props {
  assetSlug: string;
  accountPkh: string;
  areDetailsShown: boolean;
}

export const CollectibleItem: FC<Props> = ({ assetSlug, accountPkh, areDetailsShown }) => {
  const { popup } = useAppEnv();
  const metadata = useTokenMetadataSelector(assetSlug);
  const toDisplayRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(true);
  const { data: balance } = useBalance(assetSlug, accountPkh, { displayed, suspense: false });

  const areDetailsLoading = useAllCollectiblesDetailsLoadingSelector();
  const details = useCollectibleDetailsSelector(assetSlug);

  const listing = useMemo(() => {
    if (!details?.listing) return null;

    const { floorPrice, currencyId } = details.listing;

    const currency = objktCurrencies[currencyId];

    if (!isDefined(currency)) return null;

    return { floorPrice, decimals: currency.decimals, symbol: currency.symbol };
  }, [details]);

  const handleIntersection = useCallback(() => {
    setDisplayed(true);
  }, [setDisplayed]);

  useIntersectionDetection(toDisplayRef, handleIntersection, !displayed);

  const assetName = getAssetName(metadata);

  return (
    <Link to={`/collectible/${assetSlug}`} className="flex flex-col border border-gray-300 rounded-lg">
      <div
        ref={toDisplayRef}
        className={clsx(
          'relative flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden hover:opacity-70',
          areDetailsShown && 'border-b border-gray-300',
          popup ? 'h-26.5' : 'h-31.25'
        )}
        title={assetName}
      >
        {displayed && (
          <CollectibleItemImage
            assetSlug={assetSlug}
            metadata={metadata}
            areDetailsLoading={areDetailsLoading && details === undefined}
            mime={details?.mime}
          />
        )}

        {areDetailsShown && balance ? (
          <div className="absolute bottom-1.5 left-1.5 text-xxxs text-white leading-none p-1 bg-black bg-opacity-60 rounded">
            {balance.toFixed()}×
          </div>
        ) : null}
      </div>

      {areDetailsShown && (
        <div className="mt-1 mb-2 mx-1.5">
          <h5 className="text-sm leading-5 text-gray-910 truncate">{assetName}</h5>
          <div className="text-xxxs leading-3 text-gray-600">
            <span>
              <T id="floorPrice" />:{' '}
            </span>
            {isDefined(listing) ? (
              <>
                <Money shortened smallFractionFont={false} tooltip={true}>
                  {atomsToTokens(listing.floorPrice, listing.decimals)}
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
};
