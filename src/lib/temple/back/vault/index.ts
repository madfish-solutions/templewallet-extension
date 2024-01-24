import { HttpResponseError } from '@taquito/http-utils';
import { DerivationType } from '@taquito/ledger-signer';
import { localForger } from '@taquito/local-forging';
import { CompositeForger, RpcForger, Signer, TezosOperationError, TezosToolkit } from '@taquito/taquito';
import * as TaquitoUtils from '@taquito/utils';
import * as Bip39 from 'bip39';
import type * as WasmThemisPackageInterface from 'wasm-themis';

import { formatOpParamsBeforeSend, loadFastRpcClient, michelEncoder } from 'lib/temple/helpers';
import * as Passworder from 'lib/temple/passworder';
import { clearAsyncStorages } from 'lib/temple/reset';
import { TempleAccount, TempleAccountType, TempleSettings } from 'lib/temple/types';

import { createLedgerSigner } from '../ledger';
import { PublicError } from '../PublicError';

import { transformHttpResponseError } from './helpers';
import { MIGRATIONS } from './migrations';
import {
  seedToHDPrivateKey,
  seedToPrivateKey,
  deriveSeed,
  generateCheck,
  fetchNewAccountName,
  concatAccount,
  createMemorySigner,
  getMainDerivationPath,
  getPublicKeyAndHash,
  withError
} from './misc';
import {
  encryptAndSaveMany,
  fetchAndDecryptOne,
  fetchAndDecryptOneLegacy,
  getPlain,
  isStored,
  isStoredLegacy,
  removeMany,
  removeManyLegacy,
  savePlain
} from './safe-storage';
import * as SessionStore from './session-store';
import {
  checkStrgKey,
  migrationLevelStrgKey,
  mnemonicStrgKey,
  accPrivKeyStrgKey,
  accPubKeyStrgKey,
  accountsStrgKey,
  settingsStrgKey,
  legacyMigrationLevelStrgKey
} from './storage-keys';

const TEMPLE_SYNC_PREFIX = 'templesync';
const DEFAULT_SETTINGS: TempleSettings = {};
const libthemisWasmSrc = '/wasm/libthemis.wasm';

export class Vault {
  static async isExist() {
    const stored = await isStored(checkStrgKey);
    if (stored) return stored;

    return isStoredLegacy(checkStrgKey);
  }

  static async setup(password: string, saveSession = false) {
    return withError('Failed to unlock wallet', async () => {
      await Vault.runMigrations(password);

      const { passHash, passKey } = await Vault.toValidPassKey(password);

      if (saveSession) await SessionStore.savePassHash(passHash);

      return new Vault(passKey);
    });
  }

  static async recoverFromSession() {
    const passHash = await SessionStore.getPassHash();
    if (!passHash) return null;
    const passKey = await Passworder.importKey(passHash);
    return new Vault(passKey);
  }

  static forgetSession() {
    return SessionStore.removePassHash();
  }

  /**
   * Creates a new wallet and saves it securely.
   * @param password Password for encryption
   * @param mnemonic Seed phrase
   * @returns Initial account address
   */
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

      await SessionStore.removePassHash();

      await clearAsyncStorages();

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

      return accPublicKeyHash;
    });
  }

  static async runMigrations(password: string) {
    await Vault.assertValidPassword(password);

    let migrationLevel: number;

    const legacyMigrationLevelStored = await isStoredLegacy(legacyMigrationLevelStrgKey);

    if (legacyMigrationLevelStored) {
      migrationLevel = await withError('Invalid password', async () => {
        const legacyPassKey = await Passworder.generateKeyLegacy(password);
        return fetchAndDecryptOneLegacy<number>(legacyMigrationLevelStrgKey, legacyPassKey);
      });
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
        // Override migration level, force
        migrationLevel = 3;
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
    const { passKey } = await Vault.toValidPassKey(password);
    return withError('Failed to reveal seed phrase', () => fetchAndDecryptOne<string>(mnemonicStrgKey, passKey));
  }

  static async generateSyncPayload(password: string) {
    let WasmThemis: typeof WasmThemisPackageInterface;
    try {
      WasmThemis = await import('wasm-themis');
      await WasmThemis.initialize(libthemisWasmSrc);
    } catch (error) {
      console.error(error);
    }

    const { passKey } = await Vault.toValidPassKey(password);
    return withError('Failed to generate sync payload', async () => {
      const [mnemonic, allAccounts] = await Promise.all([
        fetchAndDecryptOne<string>(mnemonicStrgKey, passKey),
        fetchAndDecryptOne<TempleAccount[]>(accountsStrgKey, passKey)
      ]);

      const hdAccounts = allAccounts.filter(acc => acc.type === TempleAccountType.HD);

      const data = [mnemonic, hdAccounts.length];

      const payload = Uint8Array.from(Buffer.from(JSON.stringify(data)));
      const cell = WasmThemis.SecureCellSeal.withPassphrase(password);
      const encrypted = cell.encrypt(payload);

      return [TEMPLE_SYNC_PREFIX, encrypted].map(item => Buffer.from(item).toString('base64')).join('');
    });
  }

  static async revealPrivateKey(accPublicKeyHash: string, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);
    return withError('Failed to reveal private key', async () => {
      const privateKeySeed = await fetchAndDecryptOne<string>(accPrivKeyStrgKey(accPublicKeyHash), passKey);
      const signer = await createMemorySigner(privateKeySeed);
      return signer.secretKey();
    });
  }

  static async removeAccount(accPublicKeyHash: string, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);
    return withError('Failed to remove account', async doThrow => {
      const allAccounts = await fetchAndDecryptOne<TempleAccount[]>(accountsStrgKey, passKey);
      const acc = allAccounts.find(a => a.publicKeyHash === accPublicKeyHash);
      if (!acc || acc.type === TempleAccountType.HD) {
        doThrow();
      }

      const newAllAcounts = allAccounts.filter(currentAccount => currentAccount.publicKeyHash !== accPublicKeyHash);
      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], passKey);

      await removeMany([accPrivKeyStrgKey(accPublicKeyHash), accPubKeyStrgKey(accPublicKeyHash)]);

      return newAllAcounts;
    });
  }

  private static toValidPassKey(password: string) {
    return withError('Invalid password', async doThrow => {
      const passHash = await Passworder.generateHash(password);
      const passKey = await Passworder.importKey(passHash);
      try {
        await fetchAndDecryptOne<any>(checkStrgKey, passKey);
      } catch (error) {
        console.error(error);
        doThrow();
      }
      return { passHash, passKey };
    });
  }

  private static assertValidPassword(password: string) {
    return withError('Invalid password', async () => {
      const legacyCheckStored = await isStoredLegacy(checkStrgKey);
      if (legacyCheckStored) {
        const legacyPassKey = await Passworder.generateKeyLegacy(password);
        await fetchAndDecryptOneLegacy<any>(checkStrgKey, legacyPassKey);
      } else {
        const passKey = await Passworder.generateKey(password);
        await fetchAndDecryptOne<any>(checkStrgKey, passKey);
      }
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
      const accName = name || (await fetchNewAccountName(allAccounts));

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
        name: await fetchNewAccountName(allAccounts),
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
        name: await fetchNewAccountName(
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
        name: await fetchNewAccountName(
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
            throw await transformHttpResponseError(err);

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

  private async getSigner(accPublicKeyHash: string): Promise<{ signer: Signer; cleanup: () => void }> {
    const allAccounts = await this.fetchAccounts();
    const acc = allAccounts.find(a => a.publicKeyHash === accPublicKeyHash);
    if (!acc) {
      throw new PublicError('Account not found');
    }

    switch (acc.type) {
      case TempleAccountType.Ledger:
        const publicKey = await this.revealPublicKey(accPublicKeyHash);
        return await createLedgerSigner(acc.derivationPath, acc.derivationType, publicKey, accPublicKeyHash);

      case TempleAccountType.WatchOnly:
        throw new PublicError('Cannot sign Watch-only account');

      default:
        const privateKey = await fetchAndDecryptOne<string>(accPrivKeyStrgKey(accPublicKeyHash), this.passKey);
        const signer = await createMemorySigner(privateKey);
        return { signer, cleanup: () => {} };
    }
  }
}
