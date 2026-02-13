import { memo } from 'react';

import type { CollectibleDetails } from 'app/store/tezos/collectibles/state';
import { ChartListItem } from 'app/templates/chart-list-item';
import { NftCollectionAttribute } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { toLocalFormat } from 'lib/i18n';

import { InfoContainer } from './InfoContainer';

interface TezosAttributesProps {
  details?: CollectibleDetails | null;
}

export const TezosAttributes = memo<TezosAttributesProps>(({ details }) => {
  if (!details || !details.attributes || details.attributes.length === 0) return null;

  return (
    <InfoContainer>
      {details.attributes.map((attribute, index) => (
        <ChartListItem
          key={attribute.id}
          title={attribute.name}
          bottomSeparator={index !== details.attributes.length - 1}
        >
          <p>
            <span className="p-1 text-font-description-bold">{attribute.value}</span>
            {!isNaN(attribute.rarity) && (
              <span className="text-font-description text-grey-1">
                {toLocalFormat(attribute.rarity, { decimalPlaces: 2 })}%
              </span>
            )}
          </p>
        </ChartListItem>
      ))}
    </InfoContainer>
  );
});

interface EvmAttributesProps {
  attributes?: NftCollectionAttribute[];
}

export const EvmAttributes = memo<EvmAttributesProps>(({ attributes }) => {
  if (attributes?.length === 0) return null;

  return (
    <InfoContainer>
      {attributes?.map((attribute, index) => (
        <ChartListItem
          key={attribute.trait_type + index}
          title={attribute.trait_type}
          bottomSeparator={index !== attributes.length - 1}
        >
          <p className="p-1 text-font-description-bold">{attribute.value}</p>
        </ChartListItem>
      ))}
    </InfoContainer>
  );
});
