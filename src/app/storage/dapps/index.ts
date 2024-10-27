import type { TempleDAppMetadata, TempleDAppNetwork } from '@temple-wallet/dapp/dist/types';

import { fetchFromStorage, putToStorage, removeFromStorage } from 'lib/storage';

export const storageKey = 'dapp_sessions';

export interface TezosDAppSession {
  network: TempleDAppNetwork;
  appMeta: TempleDAppMetadata;
  pkh: string;
  publicKey: string;
}

export type TezosDAppsSessionsRecord = Record<string, TezosDAppSession>;

export const getStoredTezosDappsSessions = () => fetchFromStorage<TezosDAppsSessionsRecord>(storageKey);

export const putStoredTezosDappsSessions = (value: TezosDAppsSessionsRecord) =>
  putToStorage<TezosDAppsSessionsRecord>(storageKey, value);

export const removeAllStoredTezosDappsSessions = () => removeFromStorage(storageKey);
