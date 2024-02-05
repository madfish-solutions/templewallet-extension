import { fetchFromStorage, putToStorage, removeFromStorage, useStorageValue } from 'lib/storage';

const storageKey = 'APP_UPDATE_AVAILABLE';

interface AppUpdateDetails {
  version: string;
  triggeredManually?: true;
}

export const getStoredAppUpdateDetails = () => fetchFromStorage<AppUpdateDetails>(storageKey);

export const putStoredAppUpdateDetails = (value: AppUpdateDetails) => putToStorage<AppUpdateDetails>(storageKey, value);

export const removeStoredAppUpdateDetails = () => removeFromStorage(storageKey);

export const useStoredAppUpdateDetails = () => useStorageValue<AppUpdateDetails>(storageKey);
