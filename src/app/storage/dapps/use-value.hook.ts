import { useStorage } from 'lib/temple/front';

import { TezosDAppsSessionsRecord, TezosDAppSession, storageKey } from './index';

export type { TezosDAppsSessionsRecord, TezosDAppSession };

export const useStoredTezosDappsSessions = () => useStorage<TezosDAppsSessionsRecord>(storageKey);
