import { useStorage } from 'lib/temple/front';

import { EvmDAppsSessionsRecord, TezosDAppsSessionsRecord, evmDAppStorageKey, tezosDAppStorageKey } from './index';

export const useStoredTezosDappsSessions = () => useStorage<TezosDAppsSessionsRecord>(tezosDAppStorageKey);

export const useStoredEvmDappsSessions = () => useStorage<EvmDAppsSessionsRecord>(evmDAppStorageKey);
