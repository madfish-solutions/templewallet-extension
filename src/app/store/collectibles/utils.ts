import { pick } from 'lodash';

import type { UserObjktCollectible } from 'lib/apis/objkt';

import type { CollectibleDetails } from './state';

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
    creators: info.creators.map(({ holder: { address, tzdomain } }) => ({ address, tzDomain: tzdomain })),
    galleries: info.galleries.map(({ gallery: { name } }) => ({ title: name }))
  };
};
