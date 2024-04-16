import { cloneDeep } from 'lodash';

import type { MetadataMap } from 'lib/metadata/types';

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
