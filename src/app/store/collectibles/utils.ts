import { pick } from 'lodash';

import type { UserObjktCollectible, ObjktGalleryAttributeCount } from 'lib/apis/objkt';
import { ADULT_CONTENT_TAGS } from 'lib/apis/objkt/adult-tags';
import type { ObjktAttribute, ObjktTag } from 'lib/apis/objkt/types';
import { atomsToTokens } from 'lib/temple/helpers';

import type { CollectibleDetails } from './state';

const ADULT_ATTRIBUTE_NAME = '__nsfw_';
const checkForAdultery = (attributes: ObjktAttribute[], tags: ObjktTag[]) =>
  attributes.some(({ attribute }) => attribute.name === ADULT_ATTRIBUTE_NAME) ||
  tags.some(({ tag }) => {
    return ADULT_CONTENT_TAGS.includes(tag.name);
  });

const TECHNICAL_ATTRIBUTES = ['__nsfw_', '__hazards_'];

export const convertCollectibleObjktInfoToStateDetailsType = (
  info: UserObjktCollectible,
  galleryAttributeCounts: ObjktGalleryAttributeCount[]
): CollectibleDetails => {
  const cheepestListing = info.listings_active[0];
  const listing = cheepestListing
    ? {
        floorPrice: cheepestListing.price,
        currencyId: cheepestListing.currency_id
      }
    : null;

  return {
    ...pick(info, 'fa', 'description', 'mime'),
    metadataHash: info.metadata?.split('/').pop() ?? null,
    mintedTimestamp: info.timestamp,
    supply: info.supply,
    listing,
    isAdultContent: checkForAdultery(info.attributes, info.tags),
    objktArtifactUri: info.artifact_uri,
    creators: info.creators.map(({ holder: { address, tzdomain } }) => ({ address, tzDomain: tzdomain })),
    galleries: info.galleries.map(({ gallery: { name } }) => ({ title: name })),
    royalties: parseRoyalties(info.royalties),
    attributes: info.attributes
      .filter(({ attribute: { name } }) => !TECHNICAL_ATTRIBUTES.includes(name))
      .map(({ attribute }) => {
        const rarity = parseAttributeRarity(attribute, info, galleryAttributeCounts);

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
  galleryAttributeCounts: ObjktGalleryAttributeCount[]
) => {
  const editions = (() => {
    if (info.galleries.length) {
      const attribute_id = attribute.id;

      const galleriesPKs = info.galleries.map(({ gallery: { pk } }) => pk);

      return {
        withAttribute: galleryAttributeCounts.reduce(
          (acc, count) =>
            count.attribute_id === attribute_id && galleriesPKs.includes(count.gallery_pk) ? acc + count.editions : acc,
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
