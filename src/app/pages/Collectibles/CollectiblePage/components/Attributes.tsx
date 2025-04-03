import React, { memo } from 'react';

import type { CollectibleDetails } from 'app/store/tezos/collectibles/state';
import { ChartListItem } from 'app/templates/chart-list-item';
import { NftCollectionAttribute } from 'lib/apis/temple/endpoints/evm/api.interfaces';

interface AttributesItemsProps {
  details?: CollectibleDetails | null;
}

export const Attributes = memo<AttributesItemsProps>(({ details }) => {
  if (!details || !details.attributes || details.attributes.length === 0) return null;

  return (
    <div className="flex flex-col p-4 rounded-8 shadow-bottom bg-white">
      {details.attributes.map((attribute, index) => (
        <ChartListItem
          key={attribute.id}
          title={attribute.name}
          bottomSeparator={index !== details.attributes.length - 1}
        >
          <p>
            <span className="p-1 text-font-description-bold">{attribute.value}</span>
            {!isNaN(attribute.rarity) && (
              <span className="text-font-description text-grey-1">{attribute.rarity.toFixed(2)}%</span>
            )}
          </p>
        </ChartListItem>
      ))}
    </div>
  );
});

interface EvmAttributesItemsProps {
  attributes: NftCollectionAttribute[];
}

export const EvmAttributesItems = memo<EvmAttributesItemsProps>(({ attributes }) => (
  <>
    {attributes.map(attribute => (
      <div
        key={attribute.trait_type}
        className="flex flex-col justify-between gap-y-1 p-2 border border-gray-300 rounded-md text-center break-words"
      >
        <span className="text-xs text-gray-600 leading-5">{attribute.trait_type}</span>
        <h6 className="text-base font-semibold leading-5">{attribute.value}</h6>
      </div>
    ))}
  </>
));
