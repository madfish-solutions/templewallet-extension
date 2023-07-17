import type { UserObjktCollectible } from 'lib/apis/objkt';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface CollectibleDetails extends Pick<UserObjktCollectible, 'fa' | 'description'> {
  metadataHash: string | null;
  /** Minted on date.
   * ISO String (e.g. `2023-05-30T09:40:33+00:00`)
   */
  /** Editions */
  supply: number;
  mintedTimestamp: string;
  /** Cheepest listing */
  listing: null | CollectibleDetailsListing;
  /** Highest offer */
  highestOffer?: UserObjktCollectible['offers_active'][number];
  creators: CollectibleDetailsCreator[];
  galleries: CollectibleDetailsGallery[];
  /** Percents */
  royalties?: number;
  attributes: UserObjktCollectible['attributes'][number]['attribute'][];
}

interface CollectibleDetailsListing {
  /** In atoms */
  floorPrice: number;
  currencyId: number;
}

interface CollectibleDetailsCreator {
  address: string;
  tzDomain: string;
}

interface CollectibleDetailsGallery {
  title: string;
}

export type CollectibleDetailsRecord = Record<string, CollectibleDetails>;

export interface CollectiblesState {
  details: LoadableEntityState<CollectibleDetailsRecord>;
}

export const collectiblesInitialState: CollectiblesState = {
  details: createEntity({})
};
