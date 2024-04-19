import { cloneDeep } from 'lodash';

import type { TokenMetadata } from 'lib/metadata';

/**
 * Maps are up to 2000 times faster to read from than arrays.
 * Be sure to convert to a serializible value before persisting.
 */
export type MetadataMap = Map<string, TokenMetadata>;

export interface SliceState {
  records: MetadataMap;
  isLoading: boolean;
}

export const collectiblesMetadataInitialState: SliceState = {
  records: new Map(),
  isLoading: false
};

/** Cannot use initial value during migrations - object is frozen & forbids mutations. */
export const collectiblesMetadataInitialStateClone = cloneDeep(collectiblesMetadataInitialState);

export const sanitizeCollectiblesMetadataForDevTools = <S extends SliceState>(state: S): S => ({
  ...state,
  records: Array.from(state.records.values()) as unknown as MetadataMap
});
