import { createEntity, LoadableEntityState } from 'lib/store';

export interface CollectibleDetails {
  listing?: {
    /** In atoms */
    floorPrice?: number;
    currencyId?: number;
  };
  isAdultContent: boolean;
}

export type CollectibleDetailsRecord = Record<string, CollectibleDetails>;

export interface CollectiblesState {
  details: LoadableEntityState<CollectibleDetailsRecord>;
}

export const collectiblesInitialState: CollectiblesState = {
  details: createEntity({})
};
