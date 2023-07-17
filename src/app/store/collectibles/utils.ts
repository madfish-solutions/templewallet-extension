import { isDefined } from '@rnw-community/shared';
import { pick } from 'lodash';

import type { UserObjktCollectible } from 'lib/apis/objkt';
import { atomsToTokens } from 'lib/temple/helpers';

import type { CollectibleDetails } from './state';

const HIDDEN_ATTRIBUTE_NAME = '__nsfw_';

export const conertCollectibleObjktInfoToStateDetailsType = (info: UserObjktCollectible): CollectibleDetails => {
  const cheepestListing = info.listings_active[0];
  const listing = cheepestListing
    ? {
        floorPrice: cheepestListing.price,
        currencyId: cheepestListing.currency_id
      }
    : null;

  const highestOffer = info.offers_active[0];

  console.log('Attributes:', info.attributes);

  return {
    ...pick(info, 'fa', 'description'),
    metadataHash: info.metadata?.split('/').pop() ?? null,
    mintedTimestamp: info.timestamp,
    supply: info.supply,
    listing,
    highestOffer,
    creators: info.creators.map(({ holder: { address, tzdomain } }) => ({ address, tzDomain: tzdomain })),
    galleries: info.galleries.map(({ gallery: { name } }) => ({ title: name })),
    royalties: parseRoyalties(info.royalties),
    attributes: info.attributes.map(({ attribute }) => attribute).filter(({ name }) => name !== HIDDEN_ATTRIBUTE_NAME)
  };
};

const parseRoyalties = ([royalties]: { amount: number; decimals: number }[]) => {
  if (!isDefined(royalties)) return;

  const { amount, decimals } = royalties;

  return atomsToTokens(amount, decimals).multipliedBy(100).toNumber();
};
