import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, WALLETS_SPECS_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';
import { assertResponse, makeIntercomRequest } from 'temple/front/intercom-client';

import { TempleMessageType, WalletSpecs } from '../types';

let mnemonicBackup: string | undefined;
let loadPromise: Promise<void> | undefined;

export async function loadMnemonicToBackup(password: string) {
  loadPromise = (async () => {
    if (!(await fetchFromStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY))) {
      return;
    }

    const groups = (await fetchFromStorage<StringRecord<WalletSpecs>>(WALLETS_SPECS_STORAGE_KEY)) ?? {};

    if (Object.keys(groups).length === 0) {
      return;
    }

    const res = await makeIntercomRequest({
      type: TempleMessageType.RevealMnemonicRequest,
      password,
      walletId: Object.keys(groups)[0]
    });
    assertResponse(res.type === TempleMessageType.RevealMnemonicResponse);

    mnemonicBackup = res.mnemonic;
  })();

  await loadPromise;
}

export async function getMnemonicToBackup() {
  if (!mnemonicBackup && loadPromise) {
    await loadPromise;
  }

  return mnemonicBackup;
}

export function setMnemonicToBackup(mnemonic: string) {
  mnemonicBackup = mnemonic;
}

export function clearMnemonicToBackup() {
  mnemonicBackup = undefined;
}
