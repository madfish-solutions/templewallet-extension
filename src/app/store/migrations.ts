import { MigrationManifest, PersistedState } from 'redux-persist';

import { RootStateV1 } from './root-state.type';

export const migrations: MigrationManifest = {
  2: state => {
    const persistedState = state as RootStateV1 & PersistedState;

    return {
      ...persistedState,
      tokensMetadata: {
        ...persistedState.tokensMetadata,
        metadataRecord: Object.fromEntries(
          Object.entries(persistedState.tokensMetadata.metadataRecord).map(([slug, value]) => [
            slug,
            {
              ...value,
              id: String(value.id)
            }
          ])
        )
      }
    };
  }
};
