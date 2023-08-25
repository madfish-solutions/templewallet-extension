import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { HashChip, ExternalLinkChip } from 'app/atoms';
import type { CollectibleDetails } from 'app/store/collectibles/state';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { useBalance, useExplorerBaseUrls } from 'lib/temple/front';

interface AttributesItemsProps {
  details?: CollectibleDetails | null;
}

export const AttributesItems: FC<AttributesItemsProps> = ({ details }) => {
  return (
    <>
      {details?.attributes.map(attribute => (
        <div
          key={attribute.id}
          className="flex flex-col justify-between gap-y-1 p-2 border border-gray-300 rounded-md text-center break-words"
        >
          <span className="text-xs text-gray-600 leading-5">{attribute.name}</span>
          <h6 className="text-base font-semibold leading-5">{attribute.value}</h6>
          <span className="text-xs text-gray-600 leading-5">{attribute.rarity.toFixed(2)}%</span>
        </div>
      ))}
    </>
  );
};

interface PropertiesItemsProps {
  assetSlug: string;
  accountPkh: string;
  details?: CollectibleDetails | null;
}

export const PropertiesItems: FC<PropertiesItemsProps> = ({ assetSlug, accountPkh, details }) => {
  const { data: balance } = useBalance(assetSlug, accountPkh, {
    suspense: false
  });
  const { account: accountExplorerBaseUrl } = useExplorerBaseUrls();

  const mintedTimestamp = useMemo(() => {
    const mintedTimestamp = details?.mintedTimestamp;
    if (!mintedTimestamp) return '-';

    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(mintedTimestamp)
    );
  }, [details]);

  const royaltiesStr = useMemo(() => {
    if (!details?.royalties) return '-';

    const royalties = new BigNumber(details.royalties).decimalPlaces(2);

    return `${royalties.toString()}%`;
  }, [details]);

  const { contract, id } = fromFa2TokenSlug(assetSlug);

  const itemClassName = 'flex flex-col gap-y-2 p-3 border border-gray-300 rounded-md';
  const itemTitleClassName = 'text-xs text-gray-600 leading-5';
  const itemValueClassName = 'text-base font-semibold leading-5 break-words';

  return (
    <>
      <div className={itemClassName}>
        <h6 className={itemTitleClassName}>Editions</h6>
        <span className={itemValueClassName}>{details?.supply ?? '-'}</span>
      </div>

      <div className={itemClassName}>
        <h6 className={itemTitleClassName}>Owned</h6>
        <span className={itemValueClassName}>{balance?.toString() ?? '-'}</span>
      </div>

      <div className={itemClassName}>
        <h6 className={itemTitleClassName}>Minted</h6>
        <span className={itemValueClassName}>{mintedTimestamp}</span>
      </div>

      <div className={itemClassName}>
        <h6 className={itemTitleClassName}>Royalties</h6>
        <span className={itemValueClassName}>{royaltiesStr}</span>
      </div>

      <div className={itemClassName}>
        <h6 className={itemTitleClassName}>Contract</h6>
        <div className="flex gap-x-1.5">
          <HashChip
            hash={contract}
            firstCharsCount={5}
            lastCharsCount={5}
            className="tracking-tighter"
            rounded="base"
          />
          <ExternalLinkChip href={new URL(contract, accountExplorerBaseUrl).href} tooltip="Explore contract" />
        </div>
      </div>

      <div className={itemClassName}>
        <h6 className={itemTitleClassName}>Metadata</h6>
        {details?.metadataHash ? (
          <div className="flex gap-x-1.5">
            <span className="rounded p-1 text-sm leading-4 text-gray-600 bg-gray-100">IPFS</span>
            <ExternalLinkChip href={`https://ipfs.io/ipfs/${details.metadataHash}`} tooltip="Open metadata" />
          </div>
        ) : (
          <span className={itemValueClassName}>-</span>
        )}
      </div>

      <div className={itemClassName}>
        <h6 className={itemTitleClassName}>Token id</h6>
        <span className={itemValueClassName}>{id.toString()}</span>
      </div>
    </>
  );
};
