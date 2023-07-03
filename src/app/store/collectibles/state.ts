import { createEntity, LoadableEntityState } from 'lib/store';

export interface CollectibleDetails {
  /** In muTEZ */
  floorPrice: number | null;
}

export type CollectibleDetailsRecord = Record<string, CollectibleDetails>;

export interface CollectiblesState {
  details: LoadableEntityState<CollectibleDetailsRecord>;
}

export const collectiblesInitialState: CollectiblesState = {
  details: createEntity({})
};
