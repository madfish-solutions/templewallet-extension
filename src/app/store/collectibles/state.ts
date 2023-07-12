import type { UserObjktCollectible } from 'lib/apis/objkt';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface CollectibleDetails extends Pick<UserObjktCollectible, 'fa' | 'description'> {
  /** Cheepest listing */
  listing: null | {
    /** In atoms */
    floorPrice: number;
    currencyId: number;
  };
  creators: {
    address: string;
    tzDomain: string;
  }[];
  galleries: {
    title: string;
  }[];
}

export type CollectibleDetailsRecord = Record<string, CollectibleDetails>;

export interface CollectiblesState {
  details: LoadableEntityState<CollectibleDetailsRecord>;
}

export const collectiblesInitialState: CollectiblesState = {
  details: createEntity({})
};
