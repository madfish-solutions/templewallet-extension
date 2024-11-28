import { useStorage } from 'lib/temple/front';

import { TezosDAppsSessionsRecord, tezosDAppStorageKey } from './index';

export const useStoredTezosDappsSessions = () => useStorage<TezosDAppsSessionsRecord>(tezosDAppStorageKey);
