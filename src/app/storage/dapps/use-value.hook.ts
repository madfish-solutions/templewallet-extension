import { useStorage } from 'lib/temple/front';

import { TezosDAppsSessionsRecord, storageKey } from './index';

export const useStoredTezosDappsSessions = () => useStorage<TezosDAppsSessionsRecord>(storageKey);
