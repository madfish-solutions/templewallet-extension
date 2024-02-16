import { type Storage as StorageInterface } from 'redux-persist';
import browser from 'webextension-polyfill';

export const ReduxPersistStorage: StorageInterface = {
  getItem(key: string) {
    return browser.storage.local.get(key).then(records => records[key] ?? null);
  },

  setItem(key: string, value: any) {
    return browser.storage.local.set({ [key]: value });
  },

  removeItem(key: string) {
    return browser.storage.local.remove(key);
  }
};
