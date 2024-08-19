import type { MetadataMap } from 'lib/metadata/types';

export interface SliceState {
  records: MetadataMap;
  isLoading: boolean;
}

export const collectiblesMetadataInitialState: SliceState = {
  records: new Map(),
  isLoading: false
};

export const sanitizeCollectiblesMetadataForDevTools = <S extends SliceState>(state: S): S => ({
  ...state,
  records: Array.from(state.records.values()) as unknown as MetadataMap
});
