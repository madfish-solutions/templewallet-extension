import { fetchFromStorage, putToStorage } from 'lib/storage';

export const storageKey = 'APP_UPDATE_AVAILABLE';

export interface AppUpdateDetails {
  version: string;
  triggeredManually?: true;
}

export const getStoredAppUpdateDetails = () => fetchFromStorage<AppUpdateDetails>(storageKey);

export const putStoredAppUpdateDetails = (value: AppUpdateDetails) => putToStorage<AppUpdateDetails>(storageKey, value);
