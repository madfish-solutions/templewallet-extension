import type { UserObjktCollectible } from 'lib/apis/objkt';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface CollectibleDetails extends Pick<UserObjktCollectible, 'fa' | 'description'> {
  /** Cheepest listing */
  listing: null | CollectibleDetailsListing;
  creators: CollectibleDetailsCreator[];
  galleries: CollectibleDetailsGallery[];
  isAdultContent: boolean;
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
