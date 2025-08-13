import type { Browser, Storage } from 'webextension-polyfill';
import browserDefault from 'webextension-polyfill';

export const browser = browserDefault as Browser & {
  storage: { session?: Storage.LocalStorageArea };
};
