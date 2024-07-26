import { fetchFromStorage, putToStorage } from 'lib/storage';

export const APP_INSTALL_IDENTITY_STORAGE_KEY = 'APP_INSTALL_IDENTITY';

interface AppInstallIdentity {
  version: string;
  privateKey: string;
  publicKey: string;
  publicKeyHash: string;
  ts: string;
}

export const getStoredAppInstallIdentity = () => fetchFromStorage<AppInstallIdentity>(APP_INSTALL_IDENTITY_STORAGE_KEY);

export const putStoredAppInstallIdentity = (value: AppInstallIdentity) =>
  putToStorage<AppInstallIdentity>(APP_INSTALL_IDENTITY_STORAGE_KEY, value);
