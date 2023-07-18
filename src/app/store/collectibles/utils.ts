import { isDefined } from '@rnw-community/shared';
import { pick } from 'lodash';

import type { UserObjktCollectible, ObjktGalleryAttributeCount } from 'lib/apis/objkt';
import { atomsToTokens } from 'lib/temple/helpers';

import type { CollectibleDetails } from './state';

const HIDDEN_ATTRIBUTE_NAME = '__nsfw_';

export const convertCollectibleObjktInfoToStateDetailsType = (
  info: UserObjktCollectible,
  galaryAttributeCounts: ObjktGalleryAttributeCount[]
): CollectibleDetails => {
  const cheepestListing = info.listings_active[0];
  const listing = cheepestListing
    ? {
        floorPrice: cheepestListing.price,
        currencyId: cheepestListing.currency_id
      }
    : null;

  return {
    ...pick(info, 'fa', 'description'),
    metadataHash: info.metadata?.split('/').pop() ?? null,
    mintedTimestamp: info.timestamp,
    supply: info.supply,
    listing,
    offers: info.offers_active,
    creators: info.creators.map(({ holder: { address, tzdomain } }) => ({ address, tzDomain: tzdomain })),
    galleries: info.galleries.map(({ gallery: { name } }) => ({ title: name })),
    royalties: parseRoyalties(info.royalties),
    attributes: info.attributes
      .filter(({ attribute: { name } }) => name !== HIDDEN_ATTRIBUTE_NAME)
      .map(({ attribute }) => {
        const rarity = parseAttributeRarity(attribute, info, galaryAttributeCounts);

        return { ...attribute, rarity };
      })
  };
};

const parseRoyalties = ([royalties]: { amount: number; decimals: number }[]) => {
  if (!isDefined(royalties)) return;

  const { amount, decimals } = royalties;

  return atomsToTokens(amount, decimals).multipliedBy(100).toNumber();
};

const parseAttributeRarity = (
  attribute: UserObjktCollectible['attributes'][number]['attribute'],
  info: UserObjktCollectible,
  galaryAttributeCounts: ObjktGalleryAttributeCount[]
) => {
  const gallery = info.galleries[0]?.gallery;

  const editions = (() => {
    if (gallery)
      return {
        withAttribute: galaryAttributeCounts.find(({ attribute_id }) => attribute_id === attribute.id)?.editions ?? 0,
        all: gallery.editions
      };

    return {
      withAttribute: attribute.attribute_counts[0]?.editions ?? 0,
      all: info.fa.editions
    };
  })();

  return (editions.withAttribute / editions.all) * 100;
};
