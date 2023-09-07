import React, { memo } from 'react';

import type { CollectibleDetails } from 'app/store/collectibles/state';

interface AttributesItemsProps {
  details?: CollectibleDetails | null;
}

export const AttributesItems = memo<AttributesItemsProps>(({ details }) => {
  if (!details) return null;

  return (
    <>
      {details.attributes.map(attribute => (
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
});
