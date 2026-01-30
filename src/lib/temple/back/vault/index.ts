import type Eth from '@ledgerhq/hw-app-eth';
import { DerivationType } from '@taquito/ledger-signer';
import { localForger } from '@taquito/local-forging';
import * as TaquitoUtils from '@taquito/utils';
import { CompositeForger, OperationBatch, RpcForger, Signer, TezosToolkit } from '@tezos-x/octez.js';
import * as Bip39 from 'bip39';
import { nanoid } from 'nanoid';
import {
  createWalletClient,
  LocalAccount,
  PrivateKeyAccount,
  SignableMessage,
  TransactionRequest,
  TypedDataDefinition
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type * as WasmThemisPackageInterface from 'wasm-themis';

import {
  ACCOUNT_ALREADY_EXISTS_ERR_MSG,
  ACCOUNT_NAME_COLLISION_ERR_MSG,
  AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG,
  DEFAULT_EVM_DERIVATION_PATH,
  DEFAULT_TEZOS_DERIVATION_PATH,
  WALLETS_SPECS_STORAGE_KEY
} from 'lib/constants';
import { fetchFromStorage as getPlain, putToStorage as savePlain } from 'lib/storage';
import { mnemonicToPrivateKey } from 'lib/temple/accounts-helpers';
import { deleteEvmActivitiesByAddress, deleteTezosActivitiesByAddress } from 'lib/temple/activity/repo';
import {
  fetchNewGroupName,
  formatOpParamsBeforeSend,
  getSameGroupAccounts,
  isNameCollision,
  toExcelColumnName
} from 'lib/temple/helpers';
import * as Passworder from 'lib/temple/passworder';
import { clearAsyncStorages } from 'lib/temple/reset';
import {
  EvmDefaultWallet,
  SaveLedgerAccountInput,
  StoredAccount,
  TempleAccountType,
  TempleSettings,
  WalletSpecs
} from 'lib/temple/types';
import { delay, isTruthy } from 'lib/utils';
import { getAccountAddressForChain, getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { TypedDataV1, typedV1SignatureHash } from 'temple/evm/typed-data-v1';
import { getCustomViemChain, getViemTransportForNetwork } from 'temple/evm/utils';
import { EvmChain } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { michelEncoder, getTezosRpcClient } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { createLedgerSigner } from '../ledger';
import { PublicError } from '../PublicError';

import { makeEvmAccount } from './evm-ledger';
import { fetchMessage } from './helpers';
import { MIGRATIONS } from './migrations';
import {
  buildEncryptAndSaveManyForAccount,
  canRemoveAccounts,
  concatAccount,
  createMemorySigner,
  fetchNewAccountName,
  generateCheck,
  mnemonicToEvmAccountCreds,
  mnemonicToTezosAccountCreds,
  privateKeyToEvmAccountCreds,
  privateKeyToTezosAccountCreds,
  withError
} from './misc';
import {
  encryptAndSaveMany,
  fetchAndDecryptOne,
  fetchAndDecryptOneLegacy,
  getPlainLegacy,
  isStored,
  isStoredLegacy,
  removeMany,
  removeManyLegacy,
  savePlainLegacy
} from './safe-storage';
import * as SessionStore from './session-store';
import {
  accountsStrgKey,
  accPrivKeyStrgKey,
  accPubKeyStrgKey,
  checkStrgKey,
  legacyMigrationLevelStrgKey,
  migrationLevelStrgKey,
  settingsStrgKey,
  walletMnemonicStrgKey
} from './storage-keys';

const TEMPLE_SYNC_PREFIX = 'templesync';
const libthemisWasmSrc = '/wasm/libthemis.wasm';
const DEFAULT_SETTINGS: TempleSettings = {
  evmDefaultWallet: EvmDefaultWallet.AlwaysAsk
};

interface RemoveAccountEventPayload {
  tezosAddress?: string;
  evmAddress?: string;
}

export class Vault {
  static removeAccountsListeners: SyncFn<RemoveAccountEventPayload[]>[] = [];
  private static ethApp: Eth | null = null;

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

      const walletId = nanoid();
      const walletName = await fetchMessage('hdWalletDefaultName', 'A');
      const initialAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.HD,
        name: await fetchMessage('defaultAccountName', '1'),
        hdIndex: hdAccIndex,
        tezosAddress: tezosAcc.address,
        evmAddress: evmAcc.address,
        walletId
      };
      const newAccounts = [initialAccount];

      const passKey = await Passworder.generateKey(password);

      await SessionStore.removePassHash();

      await clearAsyncStorages();

      await encryptAndSaveMany(
        [
          [checkStrgKey, generateCheck()],
          [walletMnemonicStrgKey(walletId), mnemonic],
          ...buildEncryptAndSaveManyForAccount(tezosAcc),
          ...buildEncryptAndSaveManyForAccount(evmAcc),
          [accountsStrgKey, newAccounts]
        ],
        passKey
      );
      await savePlain<StringRecord<WalletSpecs>>(WALLETS_SPECS_STORAGE_KEY, {
        [walletId]: { name: walletName, createdAt: Date.now() }
      });
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
      const saved = await getPlainLegacy<number>(migrationLevelStrgKey);

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

      await savePlainLegacy(migrationLevelStrgKey, MIGRATIONS.length);
    }
  }

  static async revealMnemonic(walletId: string, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);
    return withError('Failed to reveal seed phrase', () =>
      fetchAndDecryptOne<string>(walletMnemonicStrgKey(walletId), passKey)
    );
  }

  static async generateSyncPayload(password: string, walletId: string) {
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
        fetchAndDecryptOne<string>(walletMnemonicStrgKey(walletId), passKey),
        fetchAndDecryptOne<StoredAccount[]>(accountsStrgKey, passKey)
      ]);

      const hdAccounts = getSameGroupAccounts(allAccounts, TempleAccountType.HD, walletId);

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

  private static async getEthApp() {
    if (Vault.ethApp) {
      return Vault.ethApp;
    }

    const Eth = await import('@ledgerhq/hw-app-eth').then(m => m.default);
    const TransportWebHID = await import('@ledgerhq/hw-transport-webhid').then(m => m.default);
    const transport = await TransportWebHID.create();
    Vault.ethApp = new Eth(transport);

    return Vault.ethApp;
  }

  private static async clearEthApp() {
    if (Vault.ethApp) {
      await Vault.ethApp.transport.close().catch(e => console.error(e));
      Vault.ethApp = null;
    }
  }

  private static async removeAccountsKeys(accounts: StoredAccount[]) {
    const accAddresses = Object.values(TempleChainKind)
      .map(chain => accounts.map(acc => getAccountAddressForChain(acc, chain)))
      .flat()
      .filter(isTruthy);

    await removeMany(accAddresses.map(address => [accPrivKeyStrgKey(address), accPubKeyStrgKey(address)]).flat());
    Vault.removeAccountsListeners.forEach(fn =>
      fn(
        accounts.map(account => ({
          tezosAddress: getAccountAddressForTezos(account),
          evmAddress: getAccountAddressForEvm(account)
        }))
      )
    );
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

      const tezosAddress = getAccountAddressForTezos(acc);
      const evmAddress = getAccountAddressForEvm(acc);
      const newAccounts = allAccounts.filter(currentAccount => currentAccount.id !== id);
      const allHdWalletsEntries = Object.entries(
        (await getPlain<StringRecord<WalletSpecs>>(WALLETS_SPECS_STORAGE_KEY)) ?? {}
      );
      const newWalletsSpecs = Object.fromEntries(
        allHdWalletsEntries.filter(([walletId]) =>
          newAccounts.some(acc => acc.type === TempleAccountType.HD && acc.walletId === walletId)
        )
      );
      await encryptAndSaveMany([[accountsStrgKey, newAccounts]], passKey);
      await savePlain(WALLETS_SPECS_STORAGE_KEY, newWalletsSpecs);
      await Vault.removeAccountsKeys([acc]);
      if (tezosAddress) {
        await deleteTezosActivitiesByAddress(tezosAddress);
      }
      if (evmAddress) {
        await deleteEvmActivitiesByAddress(evmAddress);
      }

      return { newAccounts, newWalletsSpecs };
    });
  }

  static async removeHdWallet(id: string, password: string) {
    const { passKey } = await Vault.toValidPassKey(password);

    return withError('Failed to remove HD group', async doThrow => {
      const walletsSpecs = (await getPlain<StringRecord<WalletSpecs>>(WALLETS_SPECS_STORAGE_KEY)) ?? {};

      if (!(id in walletsSpecs)) {
        throw doThrow();
      }

      const allAccounts = await fetchAndDecryptOne<StoredAccount[]>(accountsStrgKey, passKey);
      const accountsToRemove: StoredAccount[] = getSameGroupAccounts(allAccounts, TempleAccountType.HD, id);

      if (!canRemoveAccounts(allAccounts, accountsToRemove)) {
        throw new PublicError(AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG);
      }

      const newAccounts = allAccounts.filter(acc => !accountsToRemove.includes(acc));
      const { [id]: oldGroupName, ...newWalletsSpecs } = walletsSpecs;
      await encryptAndSaveMany([[accountsStrgKey, newAccounts]], passKey);
      await savePlain<StringRecord<WalletSpecs>>(WALLETS_SPECS_STORAGE_KEY, newWalletsSpecs);
      await Vault.removeAccountsKeys(accountsToRemove);

      return { newAccounts, newWalletsSpecs };
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

  static async reset(password: string) {
    await Vault.assertValidPassword(password);
    await Vault.forgetSession();
    await clearAsyncStorages();
  }

  static subscribeToRemoveAccounts(fn: SyncFn<RemoveAccountEventPayload[]>) {
    Vault.removeAccountsListeners.push(fn);
  }

  static unsubscribeFromRemoveAccounts(fn: SyncFn<RemoveAccountEventPayload[]>) {
    Vault.removeAccountsListeners = Vault.removeAccountsListeners.filter(f => f !== fn);
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

  async fetchWalletsSpecs() {
    return (await getPlain<StringRecord<WalletSpecs>>(WALLETS_SPECS_STORAGE_KEY)) ?? {};
  }

  async fetchSettings() {
    let saved;
    try {
      saved = await fetchAndDecryptOne<TempleSettings>(settingsStrgKey, this.passKey);
    } catch {}
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  }

  async findFreeHDAccountIndex(walletId: string) {
    return withError('Failed to find free HD account index', async doThrow => {
      const [mnemonic, allAccounts, walletsSpecs] = await Promise.all([
        fetchAndDecryptOne<string>(walletMnemonicStrgKey(walletId), this.passKey),
        this.fetchAccounts(),
        this.fetchWalletsSpecs()
      ]);

      if (!(walletId in walletsSpecs)) {
        throw doThrow();
      }

      const sameGroupHDAccounts = getSameGroupAccounts(allAccounts, TempleAccountType.HD, walletId);
      const startHdIndex = Math.max(-1, ...sameGroupHDAccounts.map(a => a.hdIndex)) + 1;
      let firstSkippedAccount: StoredAccount | undefined;
      for (let skipsCount = 0; ; skipsCount++) {
        const hdIndex = startHdIndex + skipsCount;
        const tezosAcc = await mnemonicToTezosAccountCreds(mnemonic, hdIndex);
        const evmAcc = mnemonicToEvmAccountCreds(mnemonic, hdIndex);
        const sameAddressAccount = allAccounts.find(acc => {
          if (acc.type === TempleAccountType.HD) {
            return false;
          }

          const chain = 'chain' in acc ? acc.chain : TempleChainKind.Tezos;

          return chain === TempleChainKind.Tezos
            ? getAccountAddressForTezos(acc) === tezosAcc.address
            : getAccountAddressForEvm(acc) === evmAcc.address;
        });

        if (sameAddressAccount && !firstSkippedAccount) {
          firstSkippedAccount = sameAddressAccount;
        } else if (!sameAddressAccount) {
          return { hdIndex, firstSkippedAccount };
        }
      }
    });
  }

  async createHDAccount(walletId: string, name?: string, hdAccIndex?: number): Promise<StoredAccount[]> {
    return withError('Failed to create account', async doThrow => {
      const [mnemonic, allAccounts, walletsSpecs] = await Promise.all([
        fetchAndDecryptOne<string>(walletMnemonicStrgKey(walletId), this.passKey),
        this.fetchAccounts(),
        this.fetchWalletsSpecs()
      ]);

      if (!(walletId in walletsSpecs)) {
        throw doThrow();
      }

      if (!hdAccIndex) {
        hdAccIndex = (await this.findFreeHDAccountIndex(walletId)).hdIndex;
      }

      const tezosAcc = await mnemonicToTezosAccountCreds(mnemonic, hdAccIndex);
      const evmAcc = mnemonicToEvmAccountCreds(mnemonic, hdAccIndex);
      const sameAddressAccount = allAccounts.find(acc => {
        if (acc.type === TempleAccountType.HD) {
          return false;
        }

        const chain = 'chain' in acc ? acc.chain : TempleChainKind.Tezos;

        return chain === TempleChainKind.Tezos
          ? getAccountAddressForTezos(acc) === tezosAcc.address
          : getAccountAddressForEvm(acc) === evmAcc.address;
      });

      if (sameAddressAccount) {
        throw new PublicError(ACCOUNT_ALREADY_EXISTS_ERR_MSG);
      }

      const accName = name ?? (await fetchNewAccountName(allAccounts, TempleAccountType.HD, walletId));

      if (isNameCollision(allAccounts, TempleAccountType.HD, accName, walletId)) {
        throw new PublicError(ACCOUNT_NAME_COLLISION_ERR_MSG);
      }

      const newAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.HD,
        name: accName,
        hdIndex: hdAccIndex,
        tezosAddress: tezosAcc.address,
        evmAddress: evmAcc.address,
        walletId
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

      const walletsSpecs = await this.fetchWalletsSpecs();
      const groupsMnemonics = await Promise.all(
        Object.keys(walletsSpecs).map(walletId =>
          fetchAndDecryptOne<string>(walletMnemonicStrgKey(walletId), this.passKey)
        )
      );

      if (groupsMnemonics.some(m => m === mnemonic)) {
        throw new PublicError('This wallet is already imported');
      }

      const allAccounts = await this.fetchAccounts();
      const tezosAcc = await mnemonicToTezosAccountCreds(mnemonic, hdAccIndex);
      const evmAcc = mnemonicToEvmAccountCreds(mnemonic, hdAccIndex);

      const walletId = nanoid();
      const walletName = await fetchNewGroupName(walletsSpecs, i =>
        fetchMessage('hdWalletDefaultName', toExcelColumnName(i))
      );
      const accountToReplace = allAccounts.find(acc => {
        if (acc.type === TempleAccountType.HD) {
          return false;
        }

        const chain = 'chain' in acc ? acc.chain : TempleChainKind.Tezos;

        return chain === TempleChainKind.Tezos
          ? getAccountAddressForTezos(acc) === tezosAcc.address
          : getAccountAddressForEvm(acc) === evmAcc.address;
      });
      const newAccount: StoredAccount = {
        id: nanoid(),
        type: TempleAccountType.HD,
        name: accountToReplace?.name ?? (await fetchMessage('defaultAccountName', '1')),
        hdIndex: hdAccIndex,
        tezosAddress: tezosAcc.address,
        evmAddress: evmAcc.address,
        walletId
      };

      const newAccounts = concatAccount(allAccounts, newAccount);
      const newWalletsSpecs: StringRecord<WalletSpecs> = {
        ...walletsSpecs,
        [walletId]: { name: walletName, createdAt: Date.now() }
      };

      await encryptAndSaveMany(
        [
          [walletMnemonicStrgKey(walletId), mnemonic],
          ...buildEncryptAndSaveManyForAccount(tezosAcc),
          ...buildEncryptAndSaveManyForAccount(evmAcc),
          [accountsStrgKey, newAccounts]
        ],
        this.passKey
      );
      await savePlain<StringRecord<WalletSpecs>>(WALLETS_SPECS_STORAGE_KEY, newWalletsSpecs);

      return { newAccounts, newWalletsSpecs };
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
        address: accCreds.address
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
      const { chain, privateKey } = mnemonicToPrivateKey(
        mnemonic,
        msg => new PublicError(msg),
        password,
        derivationPath
      );

      return this.importAccount(chain, privateKey);
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
        chainId
      };
      const newAllAccounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany([[accountsStrgKey, newAllAccounts]], this.passKey);

      return newAllAccounts;
    });
  }

  async getLedgerTezosPk(derivationPath = DEFAULT_TEZOS_DERIVATION_PATH, derivationType?: DerivationType) {
    return withError('Failed to connect get Ledger account public key hash', async () => {
      let cleanup: EmptyFn | undefined;
      try {
        const { signer, cleanup: cleanSigner } = await createLedgerSigner(derivationPath, derivationType);
        cleanup = cleanSigner;

        const result = await signer.publicKey();

        return result;
      } catch (e: any) {
        throw new PublicError(e.message);
      } finally {
        cleanup?.();
      }
    });
  }

  async getLedgerEVMPk(derivationPath = DEFAULT_EVM_DERIVATION_PATH) {
    return withError('Failed to connect get Ledger account public key hash', async (): Promise<HexString> => {
      try {
        const ethApp = await Vault.getEthApp();
        const { publicKey } = await ethApp.getAddress(derivationPath);

        return `0x${publicKey}`;
      } catch (e: any) {
        await Vault.clearEthApp();
        throw new PublicError(e.message);
      }
    });
  }

  async createLedgerAccount(input: SaveLedgerAccountInput) {
    return withError('Failed to create Ledger account', async () => {
      try {
        const allAccounts = await this.fetchAccounts();

        if (isNameCollision(allAccounts, TempleAccountType.Ledger, input.name)) {
          throw new PublicError(ACCOUNT_NAME_COLLISION_ERR_MSG);
        }

        const { publicKey, ...storedAccountProps } = input;
        const newAccount: StoredAccount = {
          id: nanoid(),
          type: TempleAccountType.Ledger,
          ...storedAccountProps
        };
        const newAllAccounts = concatAccount(allAccounts, newAccount);

        await encryptAndSaveMany(
          [
            [accPubKeyStrgKey(input.address), publicKey],
            [accountsStrgKey, newAllAccounts]
          ],
          this.passKey
        );

        return newAllAccounts;
      } catch (e: any) {
        throw new PublicError(e.message);
      }
    });
  }

  async setAccountHidden(id: string, value: boolean) {
    return withError('Failed to set account visibility', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAllAccounts = allAccounts.map(acc => (acc.id === id ? { ...acc, hidden: value } : acc));
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
          account.type === TempleAccountType.HD ? account.walletId : undefined
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
      const walletsSpecs = await this.fetchWalletsSpecs();

      if (!(id in walletsSpecs)) {
        throw new PublicError('Group not found');
      }

      if (
        Object.entries(walletsSpecs).some(
          ([walletId, { name: currentName }]) => walletId !== id && currentName === name
        )
      ) {
        throw new PublicError('Group with this name already exists');
      }

      const newWalletsSpecs: StringRecord<WalletSpecs> = {
        ...walletsSpecs,
        [id]: { name, createdAt: walletsSpecs[id].createdAt }
      };
      await savePlain<StringRecord<WalletSpecs>>(WALLETS_SPECS_STORAGE_KEY, newWalletsSpecs);

      return newWalletsSpecs;
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

  async provePossession(accPublicKeyHash: string) {
    return withError('Failed to prove possession', () =>
      this.withSigner(
        accPublicKeyHash,
        async signer => await (signer.provePossession?.() ?? Promise.reject(new PublicError('Cannot prove possession')))
      )
    );
  }

  async sign(accPublicKeyHash: string, bytes: string, watermark?: string) {
    return withError('Failed to sign', () =>
      this.withSigner(accPublicKeyHash, async signer => {
        const watermarkBuf = watermark ? TaquitoUtils.hex2buf(watermark) : undefined;
        return signer.sign(bytes, watermarkBuf);
      })
    );
  }

  async signEvmTypedData(accPublicKeyHash: string, typedData: TypedDataDefinition | TypedDataV1) {
    return this.withSigningEvmAccount(accPublicKeyHash, async account => {
      if (Array.isArray(typedData)) {
        if (!account.sign) {
          throw new PublicError('Ledger cannot sign V1 typed data');
        }

        return account.sign({ hash: `0x${typedV1SignatureHash(typedData).toString('hex')}` });
      }

      return account.signTypedData(typedData);
    });
  }

  async signEvmMessage(accPublicKeyHash: string, message: SignableMessage) {
    return this.withSigningEvmAccount(accPublicKeyHash, async account => account.signMessage({ message }));
  }

  async sendOperations(accPublicKeyHash: string, network: TezosNetworkEssentials, opParams: any[]) {
    return this.withSigner(accPublicKeyHash, async signer => {
      let batch: OperationBatch;
      try {
        const tezos = new TezosToolkit(getTezosRpcClient(network));
        tezos.setSignerProvider(signer);
        tezos.setForgerProvider(new CompositeForger([tezos.getFactory(RpcForger)(), localForger]));
        tezos.setPackerProvider(michelEncoder);
        batch = tezos.contract.batch(opParams.map(operation => formatOpParamsBeforeSend(operation, accPublicKeyHash)));

        return await batch.send();
      } catch (err: any) {
        console.error(err);
        throw new PublicError('Failed to send operations', [err]);
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

  private async withSigningEvmAccount<T>(
    accPublicKeyHash: string,
    factory: (account: PrivateKeyAccount | LocalAccount) => Promise<T>,
    preventLedgerRetry = false
  ): Promise<T> {
    try {
      const allAccounts = await this.fetchAccounts();
      const acc = allAccounts.find(acc => getAccountAddressForEvm(acc) === accPublicKeyHash);
      if (!acc) {
        throw new PublicError('Account not found');
      }

      if (acc.type === TempleAccountType.WatchOnly) {
        throw new Error('Cannot sign Watch-only account');
      }

      const handleLedgerConnectError = async (e: unknown) => {
        const { TransportError } = await import('@ledgerhq/errors');
        await Vault.clearEthApp();

        if (e instanceof TransportError && e.message === 'Invalid channel' && !preventLedgerRetry) {
          await delay(2000);

          return this.withSigningEvmAccount(accPublicKeyHash, factory, true);
        }

        throw e;
      };

      let account: PrivateKeyAccount | LocalAccount;
      if (acc.type === TempleAccountType.Ledger) {
        try {
          account = await makeEvmAccount(await Vault.getEthApp(), acc.derivationPath);
        } catch (e) {
          return handleLedgerConnectError(e);
        }
      } else {
        const privateKey = await fetchAndDecryptOne<string>(accPrivKeyStrgKey(accPublicKeyHash), this.passKey);
        account = privateKeyToAccount(privateKey as HexString);
      }

      try {
        return await factory(account);
      } catch (e) {
        if (acc.type !== TempleAccountType.Ledger) {
          throw e;
        }

        return handleLedgerConnectError(e);
      }
    } catch (err: any) {
      console.error(err);

      throw new PublicError(err.details ?? err.message, [err]);
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
        return {
          signer,
          cleanup: () => {}
        };
    }
  }

  async sendEvmTransaction(
    accPublicKeyHash: string,
    network: Pick<EvmChain, 'chainId' | 'name' | 'currency' | 'rpcBaseURL'>,
    txParams: TransactionRequest
  ) {
    return this.withSigningEvmAccount(accPublicKeyHash, async account => {
      const client = createWalletClient({
        account,
        chain: getCustomViemChain(network),
        transport: getViemTransportForNetwork(network)
      });

      return await client.sendTransaction(txParams);
    });
  }
}
