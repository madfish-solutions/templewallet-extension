import { fetchFromStorage, putToStorage } from 'lib/storage';

const storageKey = 'APP_INSTALL_IDENTITY';

interface AppInstallIdentity {
  version: string;
  privateKey: string;
  publicKey: string;
  publicKeyHash: string;
  ts: string;
}

export const getStoredAppInstallIdentity = () => fetchFromStorage<AppInstallIdentity>(storageKey);

export const putStoredAppInstallIdentity = (value: AppInstallIdentity) =>
  putToStorage<AppInstallIdentity>(storageKey, value);
