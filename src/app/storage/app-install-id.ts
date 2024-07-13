import { fetchFromStorage, putToStorage, removeFromStorage } from 'lib/storage';

const storageKey = 'APP_INSTALL_IDENTITY';

export interface AppInstallIdentity {
  version: string;
  /** TODO: Encrypt? How? Via password, provided by some private package? */
  privateKey: string;
  publicKey: string;
  publicKeyHash: string;
  ts: number;
}

export const getStoredAppInstallIdentity = () => fetchFromStorage<AppInstallIdentity>(storageKey);

export const putStoredAppInstallIdentity = (value: AppInstallIdentity) =>
  putToStorage<AppInstallIdentity>(storageKey, value);

export const removeStoredAppInstallIdentity = () => removeFromStorage(storageKey);
