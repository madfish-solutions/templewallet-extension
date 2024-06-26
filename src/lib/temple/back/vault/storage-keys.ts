const STORAGE_KEY_PREFIX = 'vault';

enum StorageEntity {
  Check = 'check',
  MigrationLevel = 'migration',
  Mnemonic = 'mnemonic',
  WalletMnemonic = 'walletmnemonic',
  AccPrivKey = 'accprivkey',
  AccPubKey = 'accpubkey',
  Accounts = 'accounts',
  Settings = 'settings',
  LegacyMigrationLevel = 'mgrnlvl'
}

export const checkStrgKey = createStorageKey(StorageEntity.Check);
export const migrationLevelStrgKey = createStorageKey(StorageEntity.MigrationLevel);
/** @deprecated */
export const mnemonicStrgKey = createStorageKey(StorageEntity.Mnemonic);
export const walletMnemonicStrgKey = createDynamicStorageKey(StorageEntity.WalletMnemonic);
export const accPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPrivKey);
export const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
export const accountsStrgKey = createStorageKey(StorageEntity.Accounts);
export const settingsStrgKey = createStorageKey(StorageEntity.Settings);
export const legacyMigrationLevelStrgKey = createStorageKey(StorageEntity.LegacyMigrationLevel);

function createStorageKey(id: StorageEntity) {
  return combineStorageKey(STORAGE_KEY_PREFIX, id);
}

function createDynamicStorageKey(id: StorageEntity) {
  const keyBase = combineStorageKey(STORAGE_KEY_PREFIX, id);
  return (...subKeys: (number | string)[]) => combineStorageKey(keyBase, ...subKeys);
}

function combineStorageKey(...parts: (string | number)[]) {
  return parts.join('_');
}
