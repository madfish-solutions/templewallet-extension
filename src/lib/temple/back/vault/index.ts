import { HttpResponseError } from '@taquito/http-utils';
import { DerivationType } from '@taquito/ledger-signer';
import { localForger } from '@taquito/local-forging';
import { CompositeForger, RpcForger, Signer, TezosOperationError, TezosToolkit } from '@taquito/taquito';
import * as TaquitoUtils from '@taquito/utils';
import * as Bip39 from 'bip39';
import { nanoid } from 'nanoid';
import type * as WasmThemisPackageInterface from 'wasm-themis';

import { AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG, ACCOUNT_NAME_COLLISION_ERR_MSG } from 'lib/constants';
import {
  fetchNewGroupName,
  formatOpParamsBeforeSend,
  getDerivationPath,
  isNameCollision,
  toExcelColumnName
} from 'lib/temple/helpers';
import * as Passworder from 'lib/temple/passworder';
import { clearAsyncStorages } from 'lib/temple/reset';
import { StoredAccount, StoredHDAccount, StoredHDGroup, TempleAccountType, TempleSettings } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { getAccountAddressForChain, getAccountAddressForTezos } from 'temple/accounts';
import { michelEncoder, getTezosFastRpcClient } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { createLedgerSigner } from '../ledger';
import { PublicError } from '../PublicError';

import { fetchMessage, transformHttpResponseError } from './helpers';
import { MIGRATIONS } from './migrations';
import {
  seedToPrivateKey,
  deriveSeed,
  generateCheck,
  fetchNewAccountName,
  concatAccount,
  createMemorySigner,
  withError,
  mnemonicToTezosAccountCreds,
  mnemonicToEvmAccountCreds,
  buildEncryptAndSaveManyForAccount,
  privateKeyToTezosAccountCreds,
  privateKeyToEvmAccountCreds,
  canRemoveAccounts
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
  groupMnemonicStrgKey,
  groupsStrgKey,
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

      const hdAccIndex = 0;

      const tezosAcc = await mnemonicToTezosAccountCreds(mnemonic, hdAccIndex);
      const evmAcc = mnemonicToEvmAccountCreds(mnemonic, hdAccIndex);

      const initialGroup = {
        id: nanoid(),
        name: await fetchMessage('hdGroupDefaultName', 'A')
      };
      const initialAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.HD,
        name: await fetchMessage('defaultAccountName', '1'),
        hdIndex: hdAccIndex,
        tezosAddress: tezosAcc.address,
        evmAddress: evmAcc.address,
        groupId: initialGroup.id,
        isVisible: true
      };
      const newAccounts = [initialAccount];

      const passKey = await Passworder.generateKey(password);

      await SessionStore.removePassHash();

      await clearAsyncStorages();

      await encryptAndSaveMany(
        [
          [checkStrgKey, generateCheck()],
          [groupMnemonicStrgKey(initialGroup.id), mnemonic],
          ...buildEncryptAndSaveManyForAccount(tezosAcc),
          ...buildEncryptAndSaveManyForAccount(evmAcc),
          [accountsStrgKey, newAccounts],
          [groupsStrgKey, [initialGroup]]
        ],
        passKey
      );
      await savePlain(migrationLevelStrgKey, MIGRATIONS.length);

      return tezosAcc.address;
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

  static async revealMnemonic(groupId: string, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);
    return withError('Failed to reveal seed phrase', () =>
      fetchAndDecryptOne<string>(groupMnemonicStrgKey(groupId), passKey)
    );
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
      const [firstHDGroup] = await fetchAndDecryptOne<StoredHDGroup[]>(groupsStrgKey, passKey);
      const [mnemonic, allAccounts] = await Promise.all([
        fetchAndDecryptOne<string>(firstHDGroup.id, passKey),
        fetchAndDecryptOne<StoredAccount[]>(accountsStrgKey, passKey)
      ]);

      const hdAccounts = allAccounts.filter(acc => acc.type === TempleAccountType.HD);

      const data = [mnemonic, hdAccounts.length];

      const payload = Uint8Array.from(Buffer.from(JSON.stringify(data)));
      const cell = WasmThemis.SecureCellSeal.withPassphrase(password);
      const encrypted = cell.encrypt(payload);

      return [TEMPLE_SYNC_PREFIX, encrypted].map(item => Buffer.from(item).toString('base64')).join('');
    });
  }

  static async revealPrivateKey(address: string, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);
    return withError('Failed to reveal private key', () =>
      fetchAndDecryptOne<string>(accPrivKeyStrgKey(address), passKey)
    );
  }

  private static async removeAccountsKeys(accounts: StoredAccount[]) {
    const accAddresses = Object.values(TempleChainKind)
      .map(chain => accounts.map(acc => getAccountAddressForChain(acc, chain)))
      .flat()
      .filter(isTruthy);

    await removeMany(accAddresses.map(address => [accPrivKeyStrgKey(address), accPubKeyStrgKey(address)]).flat());
  }

  static async removeAccount(id: string, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);
    return withError('Failed to remove account', async doThrow => {
      const allAccounts = await fetchAndDecryptOne<StoredAccount[]>(accountsStrgKey, passKey);
      const acc = allAccounts.find(a => a.id === id);

      if (!acc) {
        throw doThrow();
      }

      if (!canRemoveAccounts(allAccounts, [acc])) {
        throw new PublicError(AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG);
      }

      const newAccounts = allAccounts.filter(currentAccount => currentAccount.id !== id);
      const allHdGroups = await fetchAndDecryptOne<StoredHDGroup[]>(groupsStrgKey, passKey);
      const newHdGroups = allHdGroups.filter(group =>
        newAccounts.some(acc => acc.type === TempleAccountType.HD && acc.groupId === group.id)
      );
      await encryptAndSaveMany(
        [
          [accountsStrgKey, newAccounts],
          [groupsStrgKey, newHdGroups]
        ],
        passKey
      );
      await Vault.removeAccountsKeys([acc]);

      return { newAccounts, newHdGroups };
    });
  }

  static async removeHdGroup(id: string, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);

    return withError('Failed to remove HD group', async doThrow => {
      const allHdGroups = await fetchAndDecryptOne<StoredHDGroup[]>(groupsStrgKey, passKey);
      const group = allHdGroups.find(g => g.id === id);

      if (!group) {
        throw doThrow();
      }

      const allAccounts = await fetchAndDecryptOne<StoredAccount[]>(accountsStrgKey, passKey);
      const accountsToRemove = allAccounts.filter(acc => acc.type === TempleAccountType.HD && acc.groupId === id);

      if (!canRemoveAccounts(allAccounts, accountsToRemove)) {
        throw new PublicError(AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG);
      }

      const newAccounts = allAccounts.filter(acc => !accountsToRemove.includes(acc));
      const newHdGroups = allHdGroups.filter(g => g.id !== id);
      await encryptAndSaveMany(
        [
          [accountsStrgKey, newAccounts],
          [groupsStrgKey, newHdGroups]
        ],
        passKey
      );
      await Vault.removeAccountsKeys(accountsToRemove);

      return { newAccounts, newHdGroups };
    });
  }

  static async removeAccountsByType(type: Exclude<TempleAccountType, TempleAccountType.HD>, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);

    return withError('Failed to remove accounts', async () => {
      const allAccounts = await fetchAndDecryptOne<StoredAccount[]>(accountsStrgKey, passKey);
      const accountsToRemove = allAccounts.filter(acc => acc.type === type);
      const newAccounts = allAccounts.filter(acc => acc.type !== type);
      await encryptAndSaveMany([[accountsStrgKey, newAccounts]], passKey);
      await Vault.removeAccountsKeys(accountsToRemove);

      return newAccounts;
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

  revealPublicKey(accountAddress: string) {
    return withError('Failed to reveal public key', () =>
      fetchAndDecryptOne<string>(accPubKeyStrgKey(accountAddress), this.passKey)
    );
  }

  fetchAccounts() {
    return fetchAndDecryptOne<StoredAccount[]>(accountsStrgKey, this.passKey);
  }

  fetchHdGroups() {
    return fetchAndDecryptOne<StoredHDGroup[]>(groupsStrgKey, this.passKey);
  }

  async fetchSettings() {
    let saved;
    try {
      saved = await fetchAndDecryptOne<TempleSettings>(settingsStrgKey, this.passKey);
    } catch {}
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  }

  async createHDAccount(groupId: string, name?: string, hdAccIndex?: number): Promise<StoredAccount[]> {
    return withError('Failed to create account', async doThrow => {
      const [mnemonic, allAccounts, hdGroups] = await Promise.all([
        fetchAndDecryptOne<string>(groupMnemonicStrgKey(groupId), this.passKey),
        this.fetchAccounts(),
        this.fetchHdGroups()
      ]);

      if (!hdGroups.some(g => g.id === groupId)) {
        throw doThrow();
      }

      if (!hdAccIndex) {
        const sameGroupHDAccounts = allAccounts.filter(
          (a): a is StoredHDAccount => a.type === TempleAccountType.HD && a.groupId === groupId
        );
        hdAccIndex = Math.max(-1, ...sameGroupHDAccounts.map(a => a.hdIndex)) + 1;
      }

      const accName = name || (await fetchNewAccountName(allAccounts, TempleAccountType.HD, groupId));

      if (isNameCollision(allAccounts, TempleAccountType.HD, accName, groupId)) {
        throw new PublicError(ACCOUNT_NAME_COLLISION_ERR_MSG);
      }

      const tezosAcc = await mnemonicToTezosAccountCreds(mnemonic, hdAccIndex);
      const evmAcc = mnemonicToEvmAccountCreds(mnemonic, hdAccIndex);

      const newAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.HD,
        name: accName,
        hdIndex: hdAccIndex,
        tezosAddress: tezosAcc.address,
        evmAddress: evmAcc.address,
        groupId,
        isVisible: true
      };

      const newAllAccounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          ...buildEncryptAndSaveManyForAccount(tezosAcc),
          ...buildEncryptAndSaveManyForAccount(evmAcc),
          [accountsStrgKey, newAllAccounts]
        ],
        this.passKey
      );

      return newAllAccounts;
    });
  }

  async createOrImportWallet(mnemonic?: string) {
    return withError('Failed to create wallet', async () => {
      if (!mnemonic) {
        mnemonic = Bip39.generateMnemonic(128);
      }

      const hdAccIndex = 0;

      const hdGroups = await this.fetchHdGroups();
      const groupsMnemonics = await Promise.all(
        hdGroups.map(g => fetchAndDecryptOne<string>(groupMnemonicStrgKey(g.id), this.passKey))
      );

      if (groupsMnemonics.some(m => m === mnemonic)) {
        throw new PublicError('This wallet is already imported');
      }

      const allAccounts = await this.fetchAccounts();
      const tezosAcc = await mnemonicToTezosAccountCreds(mnemonic, hdAccIndex);
      const evmAcc = mnemonicToEvmAccountCreds(mnemonic, hdAccIndex);

      const newGroup = {
        id: nanoid(),
        name: await fetchNewGroupName(hdGroups, i => fetchMessage('hdGroupDefaultName', toExcelColumnName(i)))
      };
      const newAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.HD,
        name: await fetchMessage('defaultAccountName', '1'),
        hdIndex: hdAccIndex,
        tezosAddress: tezosAcc.address,
        evmAddress: evmAcc.address,
        groupId: newGroup.id,
        isVisible: true
      };

      const newAccounts = concatAccount(allAccounts, newAccount);
      const newHdGroups = [...hdGroups, newGroup];

      await encryptAndSaveMany(
        [
          [groupMnemonicStrgKey(newGroup.id), mnemonic],
          ...buildEncryptAndSaveManyForAccount(tezosAcc),
          ...buildEncryptAndSaveManyForAccount(evmAcc),
          [accountsStrgKey, newAccounts],
          [groupsStrgKey, newHdGroups]
        ],
        this.passKey
      );

      return { newAccounts, newHdGroups };
    });
  }

  async importAccount(chain: TempleChainKind, accPrivateKey: string, encPassword?: string) {
    const errMessage = 'Failed to import account.\nThis may happen because provided Key is invalid';

    return withError(errMessage, async () => {
      const allAccounts = await this.fetchAccounts();

      const accCreds =
        chain === TempleChainKind.EVM
          ? privateKeyToEvmAccountCreds(accPrivateKey)
          : await privateKeyToTezosAccountCreds(accPrivateKey, encPassword);

      const newAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.Imported,
        chain,
        name: await fetchNewAccountName(allAccounts, TempleAccountType.Imported),
        address: accCreds.address,
        isVisible: true
      };
      const newAllAccounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [...buildEncryptAndSaveManyForAccount(accCreds), [accountsStrgKey, newAllAccounts]],
        this.passKey
      );

      return newAllAccounts;
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
      return this.importAccount(TempleChainKind.Tezos, privateKey);
    });
  }

  async importFundraiserAccount(email: string, password: string, mnemonic: string) {
    return withError('Failed to import fundraiser account', async () => {
      const seed = Bip39.mnemonicToSeedSync(mnemonic, `${email}${password}`);
      const privateKey = seedToPrivateKey(seed);
      return this.importAccount(TempleChainKind.Tezos, privateKey);
    });
  }

  async importManagedKTAccount(address: string, chainId: string, owner: string) {
    return withError('Failed to import Managed KT account', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.ManagedKT,
        name: await fetchNewAccountName(
          allAccounts,
          TempleAccountType.ManagedKT,
          undefined,
          'defaultManagedKTAccountName'
        ),
        tezosAddress: address,
        chainId,
        owner,
        isVisible: true
      };
      const newAllAccounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany([[accountsStrgKey, newAllAccounts]], this.passKey);

      return newAllAccounts;
    });
  }

  async importWatchOnlyAccount(chain: TempleChainKind, address: string, chainId?: string) {
    return withError('Failed to import Watch Only account', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.WatchOnly,
        name: await fetchNewAccountName(
          allAccounts,
          TempleAccountType.WatchOnly,
          undefined,
          'defaultWatchOnlyAccountName'
        ),
        address,
        chain,
        chainId,
        isVisible: true
      };
      const newAllAccounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany([[accountsStrgKey, newAllAccounts]], this.passKey);

      return newAllAccounts;
    });
  }

  async createLedgerAccount(name: string, derivationPath?: string, derivationType?: DerivationType) {
    return withError('Failed to connect Ledger account', async () => {
      if (!derivationPath) derivationPath = getDerivationPath(TempleChainKind.Tezos, 0);

      const { signer, cleanup } = await createLedgerSigner(derivationPath, derivationType);

      try {
        const allAccounts = await this.fetchAccounts();

        if (isNameCollision(allAccounts, TempleAccountType.Ledger, name)) {
          throw new PublicError(ACCOUNT_NAME_COLLISION_ERR_MSG);
        }

        const accPublicKey = await signer.publicKey();
        const accPublicKeyHash = await signer.publicKeyHash();

        const newAccount: StoredAccount = {
          id: nanoid(),
          type: TempleAccountType.Ledger,
          name,
          tezosAddress: accPublicKeyHash,
          derivationPath,
          derivationType,
          isVisible: true
        };
        const newAllAccounts = concatAccount(allAccounts, newAccount);

        await encryptAndSaveMany(
          [
            [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
            [accountsStrgKey, newAllAccounts]
          ],
          this.passKey
        );

        return newAllAccounts;
      } finally {
        cleanup();
      }
    });
  }

  async setAccountVisible(id: string, value: boolean) {
    return withError('Failed to set account visibility', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAllAccounts = allAccounts.map(acc => (acc.id === id ? { ...acc, isVisible: value } : acc));
      await encryptAndSaveMany([[accountsStrgKey, newAllAccounts]], this.passKey);

      return newAllAccounts;
    });
  }

  async editAccountName(id: string, name: string) {
    return withError('Failed to edit account name', async () => {
      const allAccounts = await this.fetchAccounts();
      const account = allAccounts.find(acc => acc.id === id);

      if (!account) {
        throw new PublicError('Account not found');
      }

      if (
        isNameCollision(
          allAccounts.filter(acc => acc.id !== id),
          account.type,
          name,
          account.type === TempleAccountType.HD ? account.groupId : undefined
        )
      ) {
        throw new PublicError(ACCOUNT_NAME_COLLISION_ERR_MSG);
      }

      const newAllAccounts = allAccounts.map(acc => (acc.id === id ? { ...acc, name } : acc));
      await encryptAndSaveMany([[accountsStrgKey, newAllAccounts]], this.passKey);

      return newAllAccounts;
    });
  }

  async editGroupName(id: string, name: string) {
    return withError('Failed to edit group name', async () => {
      const hdGroups = await this.fetchHdGroups();
      const group = hdGroups.find(g => g.id === id);

      if (!group) {
        throw new PublicError('Group not found');
      }

      if (hdGroups.some(group => group.id !== id && group.name === name)) {
        throw new PublicError('Group with this name already exists');
      }

      const newHdGroups = hdGroups.map(g => (g.id === id ? { ...g, name } : g));
      await encryptAndSaveMany([[groupsStrgKey, newHdGroups]], this.passKey);

      return newHdGroups;
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
        const tezos = new TezosToolkit(getTezosFastRpcClient(rpc));
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
    const acc = allAccounts.find(acc => getAccountAddressForTezos(acc) === accPublicKeyHash);
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
