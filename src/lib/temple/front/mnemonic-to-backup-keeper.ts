import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, WALLETS_SPECS_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';
import { assertResponse, makeIntercomRequest } from 'temple/front/intercom-client';

import { TempleMessageType, WalletSpecs } from '../types';

export interface BackupCredentials {
  mnemonic: string;
  password: string;
}

let backup: BackupCredentials | undefined;
let loadPromise: Promise<void> | undefined;

export async function loadBackupCredentials(password: string) {
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
      walletId: Object.keys(groups)[0] // Expecting the first wallet by number index to be the only one there at this point
    });
    assertResponse(res.type === TempleMessageType.RevealMnemonicResponse);

    backup = { mnemonic: res.mnemonic, password };
  })();

  await loadPromise;
}

export async function getBackupCredentials() {
  if (!backup && loadPromise) {
    await loadPromise;
  }

  return backup;
}

export function setBackupCredentials(mnemonic: string, password: string) {
  backup = { mnemonic, password };
}

export function clearBackupCredentials() {
  backup = undefined;
}
