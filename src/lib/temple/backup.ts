import * as WasmThemis from 'wasm-themis';

import { APP_VERSION } from 'lib/env';

interface BackupObject {
  version: string;
  mnemonic: string;
  platformOS: 'ios' | 'android' | 'extension';
}

export interface EncryptedBackupObject extends Omit<BackupObject, 'mnemonic'> {
  encryptedMnemonic: string;
}

export class BackupDamagedError extends Error {
  constructor() {
    super('Backup is damaged');
    this.name = 'BackupDamagedError';
  }
}

export const backupFileName = 'wallet-backup.json';

const libthemisWasmSrc = '/wasm/libthemis.wasm';

const initializeWasmThemis = async () => {
  try {
    await WasmThemis.initialize(libthemisWasmSrc);
  } catch {}
};

export const getSeedPhrase = async (backup: EncryptedBackupObject, password: string) => {
  try {
    const { platformOS, version, encryptedMnemonic }: EncryptedBackupObject = backup;
    console.debug(`Found backup of version ${version} for ${platformOS}`);
    await initializeWasmThemis();
    const cell = WasmThemis.SecureCellSeal.withPassphrase(password);
    const rawSeedPhrase = cell.decrypt(Buffer.from(encryptedMnemonic, 'base64'));

    return Buffer.from(rawSeedPhrase).toString('utf-8');
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new BackupDamagedError();
    }

    throw e;
  }
};

export const toEncryptedBackup = async (mnemonic: string, password: string) => {
  await initializeWasmThemis();
  const cell = WasmThemis.SecureCellSeal.withPassphrase(password);
  const backupObject = {
    version: APP_VERSION,
    encryptedMnemonic: Buffer.from(cell.encrypt(Buffer.from(mnemonic, 'utf-8'))).toString('base64'),
    platformOS: 'extension'
  };

  return JSON.stringify(backupObject);
};
