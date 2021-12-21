import { HttpResponseError } from '@taquito/http-utils';
import { DerivationType } from '@taquito/ledger-signer';
import { localForger } from '@taquito/local-forging';
import { InMemorySigner } from '@taquito/signer';
import { CompositeForger, RpcForger, Signer, TezosOperationError, TezosToolkit } from '@taquito/taquito';
import * as TaquitoUtils from '@taquito/utils';
import { LedgerTempleBridgeTransport } from '@temple-wallet/ledger-bridge';
import * as Bip39 from 'bip39';
import * as Ed25519 from 'ed25519-hd-key';

import { getMessage } from 'lib/i18n';
import { PublicError } from 'lib/temple/back/defaults';
import { TempleLedgerSigner } from 'lib/temple/back/ledger-signer';
import {
  encryptAndSaveMany,
  encryptAndSaveManyLegacy,
  fetchAndDecryptOne,
  fetchAndDecryptOneLegacy,
  getPlain,
  isStored,
  isStoredLegacy,
  removeMany,
  removeManyLegacy,
  savePlain
} from 'lib/temple/back/safe-storage';
import {
  formatOpParamsBeforeSend,
  loadFastRpcClient,
  michelEncoder,
  transformHttpResponseError
} from 'lib/temple/helpers';
import { isLedgerLiveEnabled } from 'lib/temple/ledger-live';
import * as Passworder from 'lib/temple/passworder';
import { clearStorage } from 'lib/temple/reset';
import { TempleAccount, TempleAccountType, TempleContact, TempleSettings } from 'lib/temple/types';

const TEZOS_BIP44_COINTYPE = 1729;
const STORAGE_KEY_PREFIX = 'vault';
const DEFAULT_SETTINGS: TempleSettings = {};

enum StorageEntity {
  Check = 'check',
  MigrationLevel = 'migration',
  Mnemonic = 'mnemonic',
  AccPrivKey = 'accprivkey',
  AccPubKey = 'accpubkey',
  Accounts = 'accounts',
  Settings = 'settings',
  LegacyMigrationLevel = 'mgrnlvl'
}

const checkStrgKey = createStorageKey(StorageEntity.Check);
const migrationLevelStrgKey = createStorageKey(StorageEntity.MigrationLevel);
const mnemonicStrgKey = createStorageKey(StorageEntity.Mnemonic);
const accPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPrivKey);
const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
const accountsStrgKey = createStorageKey(StorageEntity.Accounts);
const settingsStrgKey = createStorageKey(StorageEntity.Settings);
const legacyMigrationLevelStrgKey = createStorageKey(StorageEntity.LegacyMigrationLevel);

export class Vault {
  static async isExist() {
    const stored = await isStored(checkStrgKey);
    if (stored) return stored;

    return isStoredLegacy(checkStrgKey);
  }

  static async setup(password: string) {
    return withError('Failed to unlock wallet', async () => {
      await Vault.runMigrations(password);
      const passKey = await Vault.toValidPassKey(password);
      return new Vault(passKey);
    });
  }

  static async spawn(password: string, mnemonic?: string) {
    return withError('Failed to create wallet', async () => {
      if (!mnemonic) {
        mnemonic = Bip39.generateMnemonic(128);
      }
      const seed = Bip39.mnemonicToSeedSync(mnemonic);

      const hdAccIndex = 0;
      const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
      const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(accPrivateKey);

      const initialAccount: TempleAccount = {
        type: TempleAccountType.HD,
        name: 'Account 1',
        publicKeyHash: accPublicKeyHash,
        hdIndex: hdAccIndex
      };
      const newAccounts = [initialAccount];

      const passKey = await Passworder.generateKey(password);

      await clearStorage();
      await encryptAndSaveMany(
        [
          [checkStrgKey, generateCheck()],
          [mnemonicStrgKey, mnemonic],
          [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
          [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
          [accountsStrgKey, newAccounts]
        ],
        passKey
      );
      await savePlain(migrationLevelStrgKey, MIGRATIONS.length);
    });
  }

  static async runMigrations(password: string) {
    const decryptLegacySafe = <T>(strgKey: string) =>
      withError('Invalid password', async () => {
        const legacyPassKey = await Passworder.generateKeyLegacy(password);
        return fetchAndDecryptOneLegacy<T>(strgKey, legacyPassKey);
      });

    let migrationLevel: number;

    const legacyMigrationLevelStored = await isStoredLegacy(legacyMigrationLevelStrgKey);

    if (legacyMigrationLevelStored) {
      migrationLevel = await decryptLegacySafe<number>(legacyMigrationLevelStrgKey);
    } else {
      const saved = await getPlain<number>(migrationLevelStrgKey);

      migrationLevel = saved ?? 0;

      /**
       * The code below is a fix for production issue that occurred
       * due to an incorrect migration to the new migration type.
       *
       * The essence of the problem:
       * if you enter the password incorrectly after the upgrade,
       * the migration will not work (as it should),
       * but it will save that it passed.
       * And the next unlock attempt will go on a new path.
       *
       * Solution:
       * Check if there is an legacy version of checkStrgKey field in storage
       * and if there is both it and new migration record,
       * then overwrite migration level.
       */

      const legacyCheckStored = await isStoredLegacy(checkStrgKey);

      if (saved !== undefined && legacyCheckStored) {
        // Validate password
        await decryptLegacySafe(checkStrgKey);

        // Override migration level, force
        migrationLevel = saved - 1;
      }
    }

    try {
      const migrationsToRun = MIGRATIONS.filter((_m, i) => i >= migrationLevel);

      if (migrationsToRun.length === 0) {
        return;
      }

      for (const migrate of migrationsToRun) {
        await migrate(password);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      if (legacyMigrationLevelStored) {
        await removeManyLegacy([legacyMigrationLevelStrgKey]);
      }

      await savePlain(migrationLevelStrgKey, MIGRATIONS.length);
    }
  }

  static async revealMnemonic(password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to reveal seed phrase', () => fetchAndDecryptOne<string>(mnemonicStrgKey, passKey));
  }

  static async revealPrivateKey(accPublicKeyHash: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to reveal private key', async () => {
      const privateKeySeed = await fetchAndDecryptOne<string>(accPrivKeyStrgKey(accPublicKeyHash), passKey);
      const signer = await createMemorySigner(privateKeySeed);
      return signer.secretKey();
    });
  }

  static async removeAccount(accPublicKeyHash: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to remove account', async doThrow => {
      const allAccounts = await fetchAndDecryptOne<TempleAccount[]>(accountsStrgKey, passKey);
      const acc = allAccounts.find(a => a.publicKeyHash === accPublicKeyHash);
      if (!acc || acc.type === TempleAccountType.HD) {
        doThrow();
      }

      const newAllAcounts = allAccounts.filter(acc => acc.publicKeyHash !== accPublicKeyHash);
      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], passKey);

      await removeMany([accPrivKeyStrgKey(accPublicKeyHash), accPubKeyStrgKey(accPublicKeyHash)]);

      return newAllAcounts;
    });
  }

  private static toValidPassKey(password: string) {
    return withError('Invalid password', async doThrow => {
      const passKey = await Passworder.generateKey(password);
      try {
        await fetchAndDecryptOne<any>(checkStrgKey, passKey);
      } catch (err: any) {
        console.log(err);
        doThrow();
      }
      return passKey;
    });
  }

  constructor(private passKey: CryptoKey) {}

  revealPublicKey(accPublicKeyHash: string) {
    return withError('Failed to reveal public key', () =>
      fetchAndDecryptOne<string>(accPubKeyStrgKey(accPublicKeyHash), this.passKey)
    );
  }

  fetchAccounts() {
    return fetchAndDecryptOne<TempleAccount[]>(accountsStrgKey, this.passKey);
  }

  async fetchSettings() {
    let saved;
    try {
      saved = await fetchAndDecryptOne<TempleSettings>(settingsStrgKey, this.passKey);
    } catch {}
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  }

  async createHDAccount(name?: string, hdAccIndex?: number): Promise<TempleAccount[]> {
    return withError('Failed to create account', async () => {
      const [mnemonic, allAccounts] = await Promise.all([
        fetchAndDecryptOne<string>(mnemonicStrgKey, this.passKey),
        this.fetchAccounts()
      ]);

      const seed = Bip39.mnemonicToSeedSync(mnemonic);

      if (!hdAccIndex) {
        const allHDAccounts = allAccounts.filter(a => a.type === TempleAccountType.HD);
        hdAccIndex = allHDAccounts.length;
      }

      const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
      const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(accPrivateKey);
      const accName = name || getNewAccountName(allAccounts);

      if (allAccounts.some(a => a.publicKeyHash === accPublicKeyHash)) {
        return this.createHDAccount(accName, hdAccIndex + 1);
      }

      const newAccount: TempleAccount = {
        type: TempleAccountType.HD,
        name: accName,
        publicKeyHash: accPublicKeyHash,
        hdIndex: hdAccIndex
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
          [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
          [accountsStrgKey, newAllAcounts]
        ],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async importAccount(accPrivateKey: string, encPassword?: string) {
    const errMessage = 'Failed to import account.\nThis may happen because provided Key is invalid';

    return withError(errMessage, async () => {
      const allAccounts = await this.fetchAccounts();
      const signer = await createMemorySigner(accPrivateKey, encPassword);
      const [realAccPrivateKey, accPublicKey, accPublicKeyHash] = await Promise.all([
        signer.secretKey(),
        signer.publicKey(),
        signer.publicKeyHash()
      ]);

      const newAccount: TempleAccount = {
        type: TempleAccountType.Imported,
        name: getNewAccountName(allAccounts),
        publicKeyHash: accPublicKeyHash
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPrivKeyStrgKey(accPublicKeyHash), realAccPrivateKey],
          [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
          [accountsStrgKey, newAllAcounts]
        ],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async importMnemonicAccount(mnemonic: string, password?: string, derivationPath?: string) {
    return withError('Failed to import account', async () => {
      let seed;
      try {
        seed = Bip39.mnemonicToSeedSync(mnemonic, password);
      } catch (_err) {
        throw new PublicError('Invalid Mnemonic or Password');
      }

      if (derivationPath) {
        seed = deriveSeed(seed, derivationPath);
      }

      const privateKey = seedToPrivateKey(seed);
      return this.importAccount(privateKey);
    });
  }

  async importFundraiserAccount(email: string, password: string, mnemonic: string) {
    return withError('Failed to import fundraiser account', async () => {
      const seed = Bip39.mnemonicToSeedSync(mnemonic, `${email}${password}`);
      const privateKey = seedToPrivateKey(seed);
      return this.importAccount(privateKey);
    });
  }

  async importManagedKTAccount(accPublicKeyHash: string, chainId: string, owner: string) {
    return withError('Failed to import Managed KT account', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: TempleAccount = {
        type: TempleAccountType.ManagedKT,
        name: getNewAccountName(
          allAccounts.filter(({ type }) => type === TempleAccountType.ManagedKT),
          'defaultManagedKTAccountName'
        ),
        publicKeyHash: accPublicKeyHash,
        chainId,
        owner
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

      return newAllAcounts;
    });
  }

  async importWatchOnlyAccount(accPublicKeyHash: string, chainId?: string) {
    return withError('Failed to import Watch Only account', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: TempleAccount = {
        type: TempleAccountType.WatchOnly,
        name: getNewAccountName(
          allAccounts.filter(({ type }) => type === TempleAccountType.WatchOnly),
          'defaultWatchOnlyAccountName'
        ),
        publicKeyHash: accPublicKeyHash,
        chainId
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

      return newAllAcounts;
    });
  }

  async createLedgerAccount(name: string, derivationPath?: string, derivationType?: DerivationType) {
    return withError('Failed to connect Ledger account', async () => {
      if (!derivationPath) derivationPath = getMainDerivationPath(0);

      const { signer, cleanup } = await createLedgerSigner(derivationPath, derivationType);

      try {
        const accPublicKey = await signer.publicKey();
        const accPublicKeyHash = await signer.publicKeyHash();

        const newAccount: TempleAccount = {
          type: TempleAccountType.Ledger,
          name,
          publicKeyHash: accPublicKeyHash,
          derivationPath,
          derivationType
        };
        const allAccounts = await this.fetchAccounts();
        const newAllAcounts = concatAccount(allAccounts, newAccount);

        await encryptAndSaveMany(
          [
            [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
            [accountsStrgKey, newAllAcounts]
          ],
          this.passKey
        );

        return newAllAcounts;
      } finally {
        cleanup();
      }
    });
  }

  async editAccountName(accPublicKeyHash: string, name: string) {
    return withError('Failed to edit account name', async () => {
      const allAccounts = await this.fetchAccounts();
      if (!allAccounts.some(acc => acc.publicKeyHash === accPublicKeyHash)) {
        throw new PublicError('Account not found');
      }

      if (allAccounts.some(acc => acc.publicKeyHash !== accPublicKeyHash && acc.name === name)) {
        throw new PublicError('Account with same name already exist');
      }

      const newAllAcounts = allAccounts.map(acc => (acc.publicKeyHash === accPublicKeyHash ? { ...acc, name } : acc));
      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

      return newAllAcounts;
    });
  }

  async updateSettings(settings: Partial<TempleSettings>) {
    return withError('Failed to update settings', async () => {
      const current = await this.fetchSettings();
      const newSettings = { ...current, ...settings };
      await encryptAndSaveMany([[settingsStrgKey, newSettings]], this.passKey);
      return newSettings;
    });
  }

  async sign(accPublicKeyHash: string, bytes: string, watermark?: string) {
    return withError('Failed to sign', () =>
      this.withSigner(accPublicKeyHash, async signer => {
        const watermarkBuf = watermark ? TaquitoUtils.hex2buf(watermark) : undefined;
        return signer.sign(bytes, watermarkBuf);
      })
    );
  }

  async sendOperations(accPublicKeyHash: string, rpc: string, opParams: any[]) {
    return this.withSigner(accPublicKeyHash, async signer => {
      const batch = await withError('Failed to send operations', async () => {
        const tezos = new TezosToolkit(loadFastRpcClient(rpc));
        tezos.setSignerProvider(signer);
        tezos.setForgerProvider(new CompositeForger([tezos.getFactory(RpcForger)(), localForger]));
        tezos.setPackerProvider(michelEncoder);
        return tezos.contract.batch(opParams.map(formatOpParamsBeforeSend));
      });

      try {
        return await batch.send();
      } catch (err: any) {
        console.error(err);

        switch (true) {
          case err instanceof PublicError:
          case err instanceof TezosOperationError:
            throw err;

          case err instanceof HttpResponseError:
            throw transformHttpResponseError(err);

          default:
            throw new Error(`Failed to send operations. ${err.message}`);
        }
      }
    });
  }

  private async withSigner<T>(accPublicKeyHash: string, factory: (signer: Signer) => Promise<T>) {
    const { signer, cleanup } = await this.getSigner(accPublicKeyHash);
    try {
      return await factory(signer);
    } finally {
      cleanup();
    }
  }

  private async getSigner(accPublicKeyHash: string) {
    const allAccounts = await this.fetchAccounts();
    const acc = allAccounts.find(a => a.publicKeyHash === accPublicKeyHash);
    if (!acc) {
      throw new PublicError('Account not found');
    }

    switch (acc.type) {
      case TempleAccountType.Ledger:
        const publicKey = await this.revealPublicKey(accPublicKeyHash);
        return createLedgerSigner(acc.derivationPath, acc.derivationType, publicKey, accPublicKeyHash);

      case TempleAccountType.WatchOnly:
        throw new PublicError('Cannot sign Watch-only account');

      default:
        const privateKey = await fetchAndDecryptOne<string>(accPrivKeyStrgKey(accPublicKeyHash), this.passKey);
        return createMemorySigner(privateKey).then(signer => ({
          signer,
          cleanup: () => {}
        }));
    }
  }
}

/**
 * Migrations
 *
 * -> -> ->
 */

const MIGRATIONS = [
  // [1] Fix derivation
  async (password: string) => {
    const passKey = await Passworder.generateKeyLegacy(password);

    const [mnemonic, accounts] = await Promise.all([
      fetchAndDecryptOneLegacy<string>(mnemonicStrgKey, passKey),
      fetchAndDecryptOneLegacy<TempleAccount[]>(accountsStrgKey, passKey)
    ]);
    const migratedAccounts = accounts.map(acc =>
      acc.type === TempleAccountType.HD
        ? {
            ...acc,
            type: TempleAccountType.Imported
          }
        : acc
    );

    const seed = Bip39.mnemonicToSeedSync(mnemonic);
    const hdAccIndex = 0;
    const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
    const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(accPrivateKey);

    const newInitialAccount: TempleAccount = {
      type: TempleAccountType.HD,
      name: getNewAccountName(accounts),
      publicKeyHash: accPublicKeyHash,
      hdIndex: hdAccIndex
    };
    const newAccounts = [newInitialAccount, ...migratedAccounts];

    await encryptAndSaveManyLegacy(
      [
        [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
        [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
        [accountsStrgKey, newAccounts]
      ],
      passKey
    );
  },

  // [2] Add hdIndex prop to HD Accounts
  async (password: string) => {
    const passKey = await Passworder.generateKeyLegacy(password);
    const accounts = await fetchAndDecryptOneLegacy<TempleAccount[]>(accountsStrgKey, passKey);

    let hdAccIndex = 0;
    const newAccounts = accounts.map(acc =>
      acc.type === TempleAccountType.HD ? { ...acc, hdIndex: hdAccIndex++ } : acc
    );

    await encryptAndSaveManyLegacy([[accountsStrgKey, newAccounts]], passKey);
  },

  // [3] Improve token managing flow
  // Migrate from tokens{netId}: TempleToken[] + hiddenTokens{netId}: TempleToken[]
  // to tokens{chainId}: TempleToken[]
  async () => {
    // The code base for this migration has been removed
    // because it is no longer needed,
    // but this migration is required for version compatibility.
  },

  // [4] Improve crypto security
  // Migrate legacy crypto storage
  // New crypto updates:
  // - Use password hash in memory when unlocked(instead of plain password)
  // - Wrap storage keys in sha256(instead of plain)
  // - Concat storage values to bytes(instead of json)
  // - Increase PBKDF rounds
  async (password: string) => {
    const legacyPassKey = await Passworder.generateKeyLegacy(password);

    const fetchLegacySafe = async <T>(storageKey: string) => {
      try {
        return await fetchAndDecryptOneLegacy<T>(storageKey, legacyPassKey);
      } catch {
        return undefined;
      }
    };

    let [mnemonic, accounts, settings] = await Promise.all([
      fetchLegacySafe<string>(mnemonicStrgKey),
      fetchLegacySafe<TempleAccount[]>(accountsStrgKey),
      fetchLegacySafe<TempleSettings>(settingsStrgKey)
    ]);

    // Address book contacts migration
    const contacts = await getPlain<TempleContact[]>('contacts');
    settings = { ...settings, contacts };

    const accountsStrgKeys = accounts!
      .map(acc => [accPrivKeyStrgKey(acc.publicKeyHash), accPubKeyStrgKey(acc.publicKeyHash)])
      .flat();

    const accountsStrgValues = await Promise.all(accountsStrgKeys.map(fetchLegacySafe));

    const toSave = [
      [checkStrgKey, generateCheck()],
      [mnemonicStrgKey, mnemonic],
      [accountsStrgKey, accounts],
      [settingsStrgKey, settings],
      ...accountsStrgKeys.map((key, i) => [key, accountsStrgValues[i]])
    ].filter(([_key, value]) => value !== undefined) as [string, any][];

    // Save new storage items
    const passKey = await Passworder.generateKey(password);
    await encryptAndSaveMany(toSave, passKey);

    // Remove old
    await removeManyLegacy([...toSave.map(([key]) => key), 'contacts']);
  }
];

/**
 * Misc
 */

function generateCheck() {
  return Bip39.generateMnemonic(128);
}

function removeMFromDerivationPath(dPath: string) {
  return dPath.startsWith('m/') ? dPath.substring(2) : dPath;
}

function concatAccount(current: TempleAccount[], newOne: TempleAccount) {
  if (current.every(a => a.publicKeyHash !== newOne.publicKeyHash)) {
    return [...current, newOne];
  }

  throw new PublicError('Account already exists');
}

function getNewAccountName(allAccounts: TempleAccount[], templateI18nKey = 'defaultAccountName') {
  return getMessage(templateI18nKey, String(allAccounts.length + 1));
}

async function getPublicKeyAndHash(privateKey: string) {
  const signer = await createMemorySigner(privateKey);
  return Promise.all([signer.publicKey(), signer.publicKeyHash()]);
}

async function createMemorySigner(privateKey: string, encPassword?: string) {
  return InMemorySigner.fromSecretKey(privateKey, encPassword);
}

let transport: LedgerTempleBridgeTransport;

async function createLedgerSigner(
  derivationPath: string,
  derivationType?: DerivationType,
  publicKey?: string,
  publicKeyHash?: string
) {
  const ledgerLiveEnabled = await isLedgerLiveEnabled();

  if (!transport || ledgerLiveEnabled !== transport.ledgerLiveUsed) {
    await transport?.close();

    const bridgeUrl = process.env.TEMPLE_WALLET_LEDGER_BRIDGE_URL;
    if (!bridgeUrl) {
      throw new Error("Require a 'TEMPLE_WALLET_LEDGER_BRIDGE_URL' environment variable to be set");
    }

    transport = await LedgerTempleBridgeTransport.open(bridgeUrl);
    if (ledgerLiveEnabled) {
      transport.useLedgerLive();
    }
  }

  // After Ledger Live bridge was setuped, we don't close transport
  // Probably we do not need to close it
  // But if we need, we can close it after not use timeout
  const cleanup = () => {}; // transport.close();
  const signer = new TempleLedgerSigner(
    transport,
    removeMFromDerivationPath(derivationPath),
    true,
    derivationType,
    publicKey,
    publicKeyHash
  );

  return { signer, cleanup };
}

function seedToHDPrivateKey(seed: Buffer, hdAccIndex: number) {
  return seedToPrivateKey(deriveSeed(seed, getMainDerivationPath(hdAccIndex)));
}

function getMainDerivationPath(accIndex: number) {
  return `m/44'/${TEZOS_BIP44_COINTYPE}'/${accIndex}'/0'`;
}

function seedToPrivateKey(seed: Buffer) {
  return TaquitoUtils.b58cencode(seed.slice(0, 32), TaquitoUtils.prefix.edsk2);
}

function deriveSeed(seed: Buffer, derivationPath: string) {
  try {
    const { key } = Ed25519.derivePath(derivationPath, seed.toString('hex'));
    return key;
  } catch (_err) {
    throw new PublicError('Invalid derivation path');
  }
}

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

async function withError<T>(errMessage: string, factory: (doThrow: () => void) => Promise<T>) {
  try {
    return await factory(() => {
      throw new Error('<stub>');
    });
  } catch (err: any) {
    throw err instanceof PublicError ? err : new PublicError(errMessage);
  }
}
