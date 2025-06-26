import type { UserObjktCollectible } from 'lib/apis/objkt';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface CollectibleDetails extends Pick<UserObjktCollectible, 'fa' | 'description' | 'mime'> {
  metadataHash: string | null;
  /** Minted on date.
   * ISO String (e.g. `2023-05-30T09:40:33+00:00`)
   */
  mintedTimestamp: string;
  /** Editions */
  supply: number;
  /** Cheepest listing */
  listing: null | CollectibleDetailsListing;
  /** Highest offer */
  objktArtifactUri: string;
  creators: CollectibleDetailsCreator[];
  galleries: CollectibleDetailsGallery[];
  isAdultContent: boolean;
  /** Percents */
  royalties?: number;
  attributes: CollectibleDetailsAttribute[];
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

type CollectibleDetailsAttribute = UserObjktCollectible['attributes'][number]['attribute'] & {
  /** Percent */
  rarity: number;
};

/** `null` for no available asset details */
export type CollectibleDetailsRecord = Record<string, CollectibleDetails | null>;

export interface CollectiblesState {
  details: LoadableEntityState<CollectibleDetailsRecord>;
  adultFlags: Record<string, AdultFlag>;
}

interface AdultFlag {
  val: boolean;
  /** Timestamp in seconds */
  ts: number;
}

export const collectiblesInitialState: CollectiblesState = {
  details: createEntity({}),
  adultFlags: {}
};
