import React, { FC, useCallback, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import { useAppEnv } from 'app/env';
import { useOneCollectibleDetailsSelector } from 'app/store/collectibles/selectors';
import { useAssetMetadata, getAssetName, TEZOS_METADATA } from 'lib/metadata';
import { useBalance } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link } from 'lib/woozie';

import { CollectibleItemImage } from './CollectibleItemImage';

interface Props {
  assetSlug: string;
  accountPkh: string;
  detailsShown: boolean;
}

export const CollectibleItem: FC<Props> = ({ assetSlug, accountPkh, detailsShown }) => {
  const { popup } = useAppEnv();
  const metadata = useAssetMetadata(assetSlug);
  const toDisplayRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(true);
  const { data: balance } = useBalance(assetSlug, accountPkh, { displayed });
  const details = useOneCollectibleDetailsSelector(assetSlug);

  const floorPrice = details?.floorPrice;

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
          detailsShown ? 'border-b border-gray-300' : undefined
        )}
        title={assetName}
        style={{ height: popup ? 106 : 125 }}
      >
        {displayed && <CollectibleItemImage metadata={metadata} assetSlug={assetSlug} />}

        {balance ? (
          <div className="absolute bottom-1.5 left-1.5 text-2xs text-white leading-none p-1 bg-black bg-opacity-60 rounded">
            {balance.toFixed()}×
          </div>
        ) : null}
      </div>

      {detailsShown && (
        <div className="mt-1 mb-2 mx-1.5">
          <h5 className="text-sm leading-5 text-gray-910 truncate">{assetName}</h5>
          <div className="text-2xs leading-3 text-gray-600">
            <span>Floor: </span>
            {isDefined(floorPrice) ? (
              <>
                <Money shortened smallFractionFont={false} tooltip={true} cryptoDecimals={TEZOS_METADATA.decimals}>
                  {atomsToTokens(floorPrice, TEZOS_METADATA.decimals)}
                </Money>
                <span> TEZ</span>
              </>
            ) : (
              '---'
            )}
          </div>
        </div>
      )}
    </Link>
  );
};
