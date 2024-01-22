import { type WebStorage } from 'redux-persist';
import browser from 'webextension-polyfill';

const LocalStorageLikeExtensionLocalStorage: WebStorage = {
  getItem(key: string) {
    return browser.storage.local.get(key).then(records => records[key] ?? null);
  },

  setItem(key: string, value: string) {
    return browser.storage.local.set({ [key]: value });
  },

  removeItem(key: string) {
    return browser.storage.local.remove(key);
  }
};

export default LocalStorageLikeExtensionLocalStorage;
