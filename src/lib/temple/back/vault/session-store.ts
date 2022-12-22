import browser from 'webextension-polyfill';

import { arrayBufferToString, stringToArrayBuffer } from 'lib/utils';

const browserWithSessionStorage = browser as browser.Browser & {
  storage: { session: browser.Storage.LocalStorageArea };
};

const PASS_HASH_STORE_KEY = '@Vault:session.passHash';

export const savePassHash = async (passHashBuffer: ArrayBuffer) => {
  try {
    const passHashStr = arrayBufferToString(passHashBuffer);
    await browserWithSessionStorage.storage.session.set({ [PASS_HASH_STORE_KEY]: passHashStr });
  } catch (error) {
    console.error(error);
  }
};

export const getPassHash = async () => {
  try {
    const { [PASS_HASH_STORE_KEY]: passHash }: { [PASS_HASH_STORE_KEY]?: string } =
      await browserWithSessionStorage.storage.session.get(PASS_HASH_STORE_KEY);

    if (passHash) return stringToArrayBuffer(passHash);
  } catch (error) {
    console.error(error);
  }

  return;
};

export const removePassHash = async () => {
  try {
    await browserWithSessionStorage.storage.session.remove(PASS_HASH_STORE_KEY);
  } catch (error) {
    console.error(error);
  }
};
