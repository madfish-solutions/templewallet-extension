import { pick } from 'lodash';

import type { UserObjktCollectible, ObjktGalleryAttributeCount } from 'lib/apis/objkt';
import { atomsToTokens } from 'lib/temple/helpers';

import type { CollectibleDetails } from './state';

const TECHNICAL_ATTRIBUTES = ['__nsfw_', '__hazards_'];

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
      .filter(({ attribute: { name } }) => !TECHNICAL_ATTRIBUTES.includes(name))
      .map(({ attribute }) => {
        const rarity = parseAttributeRarity(attribute, info, galaryAttributeCounts);

        return { ...attribute, rarity };
      })
  };
};

const parseRoyalties = (royalties: { amount: number; decimals: number }[]) => {
  if (!royalties.length) return;

  const royaltiesSumm = royalties.reduce(
    (acc, { amount, decimals }) => acc + atomsToTokens(amount, decimals).toNumber(),
    0
  );

  return royaltiesSumm * 100;
};

const parseAttributeRarity = (
  attribute: UserObjktCollectible['attributes'][number]['attribute'],
  info: UserObjktCollectible,
  galaryAttributeCounts: ObjktGalleryAttributeCount[]
) => {
  const editions = (() => {
    if (info.galleries.length) {
      const attribute_id = attribute.id;

      return {
        withAttribute: galaryAttributeCounts.reduce(
          (acc, count) => (count.attribute_id === attribute_id ? acc + count.editions : acc),
          0
        ),
        all: info.galleries.reduce((acc, { gallery: { editions } }) => acc + editions, 0)
      };
    }

    const fa_contract = info.fa_contract;

    return {
      withAttribute: attribute.attribute_counts.reduce(
        (acc, count) => (count.fa_contract === fa_contract ? acc + count.editions : acc),
        0
      ),
      all: info.fa.editions
    };
  })();

  return (editions.withAttribute / editions.all) * 100;
};