import { pick } from 'lodash';

import type { UserObjktCollectible } from 'lib/apis/objkt';
import { ADULT_CONTENT_TAGS } from 'lib/apis/objkt/adult-tags';
import { Attribute, Tag } from 'lib/apis/objkt/types';

import type { CollectibleDetails } from './state';

const ADULT_ATTRIBUTE_NAME = '__nsfw_';
const checkForAdultery = (attributes: Attribute[], tags: Tag[]) =>
  attributes.some(({ attribute }) => attribute.name === ADULT_ATTRIBUTE_NAME) ||
  tags.some(({ tag }) => {
    return ADULT_CONTENT_TAGS.includes(tag.name);
  });

export const conertCollectibleObjktInfoToStateDetailsType = (info: UserObjktCollectible): CollectibleDetails => {
  const cheepestListing = info.listings_active[0];
  const listing = cheepestListing
    ? {
        floorPrice: cheepestListing.price,
        currencyId: cheepestListing.currency_id
      }
    : null;

  return {
    ...pick(info, 'fa', 'description'),
    listing,
    isAdultContent: checkForAdultery(info.attributes, info.tags),
    creators: info.creators.map(({ holder: { address, tzdomain } }) => ({ address, tzDomain: tzdomain })),
    galleries: info.galleries.map(({ gallery: { name } }) => ({ title: name }))
  };
};
