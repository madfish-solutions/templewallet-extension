import { browser } from 'lib/browser';
import { arrayBufferToString, stringToArrayBuffer } from 'lib/utils';

const PASS_HASH_STORE_KEY = '@Vault:session.passHash';

export const savePassHash = async (passHashBuffer: ArrayBuffer) => {
  if (browser.storage.session == null) return;

  try {
    const passHashStr = arrayBufferToString(passHashBuffer);
    await browser.storage.session.set({ [PASS_HASH_STORE_KEY]: passHashStr });
  } catch (error) {
    console.error(error);
  }
};

export const getPassHash = async () => {
  if (browser.storage.session == null) return;

  try {
    const { [PASS_HASH_STORE_KEY]: passHash }: { [PASS_HASH_STORE_KEY]?: string } = await browser.storage.session.get(
      PASS_HASH_STORE_KEY
    );

    if (passHash) return stringToArrayBuffer(passHash);
  } catch (error) {
    console.error(error);
  }

  return;
};

export const removePassHash = async () => {
  if (browser.storage.session == null) return;

  try {
    await browser.storage.session.remove(PASS_HASH_STORE_KEY);
  } catch (error) {
    console.error(error);
  }
};
