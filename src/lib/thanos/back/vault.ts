import { browser } from "webextension-polyfill-ts";
import * as Bip39 from "bip39";
import * as Ed25519 from "ed25519-hd-key";
import * as TaquitoUtils from "@taquito/utils";
import { InMemorySigner } from "@taquito/signer";
import { TezosToolkit, CompositeForger, RpcForger } from "@taquito/taquito";
import { localForger } from "@taquito/local-forging";
import * as Passworder from "lib/thanos/passworder";
import {
  ThanosAccount,
  ThanosAccountType,
  ThanosSettings,
  ThanosDAppSession,
} from "lib/thanos/types";
import {
  isStored,
  fetchAndDecryptOne,
  encryptAndSaveMany,
  removeMany,
} from "lib/thanos/back/safe-storage";

const TEZOS_BIP44_COINTYPE = 1729;
const STORAGE_KEY_PREFIX = "vault";
const DEFAULT_SETTINGS: ThanosSettings = {};

enum StorageEntity {
  Check = "check",
  MigrationLevel = "mgrnlvl",
  Mnemonic = "mnemonic",
  AccPrivKey = "accprivkey",
  AccPubKey = "accpubkey",
  Accounts = "accounts",
  Settings = "settings",
  DApps = "dapps",
}

const checkStrgKey = createStorageKey(StorageEntity.Check);
const migrationLevelStrgKey = createStorageKey(StorageEntity.MigrationLevel);
const mnemonicStrgKey = createStorageKey(StorageEntity.Mnemonic);
const accPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPrivKey);
const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
const accountsStrgKey = createStorageKey(StorageEntity.Accounts);
const settingsStrgKey = createStorageKey(StorageEntity.Settings);
const dAppsStrgKey = createStorageKey(StorageEntity.DApps);

export class Vault {
  static isExist() {
    return isStored(checkStrgKey);
  }

  static async setup(password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError("Failed to unlock wallet", async () => {
      await Vault.runMigrations(passKey);
      return new Vault(passKey);
    });
  }

  static async spawn(password: string, mnemonic?: string) {
    return withError("Failed to create wallet", async () => {
      if (!mnemonic) {
        mnemonic = Bip39.generateMnemonic(128);
      }
      const seed = Bip39.mnemonicToSeedSync(mnemonic);

      const hdAccIndex = 0;
      const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
      const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(
        accPrivateKey
      );

      const initialAccount: ThanosAccount = {
        type: ThanosAccountType.HD,
        name: "Account 1",
        publicKeyHash: accPublicKeyHash,
      };
      const newAccounts = [initialAccount];

      const passKey = await Passworder.generateKey(password);

      await browser.storage.local.clear();
      await encryptAndSaveMany(
        [
          [checkStrgKey, null],
          [migrationLevelStrgKey, MIGRATIONS.length],
          [mnemonicStrgKey, mnemonic],
          [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
          [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
          [accountsStrgKey, newAccounts],
        ],
        passKey
      );
    });
  }

  static async runMigrations(passKey: CryptoKey) {
    try {
      const migrationLevelStored = await isStored(migrationLevelStrgKey);
      const migrationLevel = migrationLevelStored
        ? await fetchAndDecryptOne<number>(migrationLevelStrgKey, passKey)
        : 0;
      const migrationsToRun = MIGRATIONS.filter((_m, i) => i >= migrationLevel);
      for (const migrate of migrationsToRun) {
        await migrate(passKey);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    } finally {
      await encryptAndSaveMany(
        [[migrationLevelStrgKey, MIGRATIONS.length]],
        passKey
      );
    }
  }

  static async revealMnemonic(password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError("Failed to reveal seed phrase", () =>
      fetchAndDecryptOne<string>(mnemonicStrgKey, passKey)
    );
  }

  static async revealPrivateKey(accPublicKeyHash: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError("Failed to reveal private key", () =>
      fetchAndDecryptOne<string>(accPrivKeyStrgKey(accPublicKeyHash), passKey)
    );
  }

  static async removeAccount(accPublicKeyHash: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError("Failed to remove account", async (doThrow) => {
      const allAccounts = await fetchAndDecryptOne<ThanosAccount[]>(
        accountsStrgKey,
        passKey
      );
      const acc = allAccounts.find((a) => a.publicKeyHash === accPublicKeyHash);
      if (!acc || acc.type !== ThanosAccountType.Imported) {
        doThrow();
      }

      const newAllAcounts = allAccounts.filter(
        (acc) => acc.publicKeyHash !== accPublicKeyHash
      );
      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], passKey);

      await removeMany([
        accPrivKeyStrgKey(accPublicKeyHash),
        accPubKeyStrgKey(accPublicKeyHash),
      ]);

      return newAllAcounts;
    });
  }

  private static toValidPassKey(password: string) {
    return withError("Invalid password", async (doThrow) => {
      const passKey = await Passworder.generateKey(password);
      const check = await fetchAndDecryptOne<any>(checkStrgKey, passKey);
      if (check !== null) {
        doThrow();
      }
      return passKey;
    });
  }

  constructor(private passKey: CryptoKey) {}

  revealPublicKey(accPublicKeyHash: string) {
    return withError("Failed to reveal public key", () =>
      fetchAndDecryptOne<string>(
        accPubKeyStrgKey(accPublicKeyHash),
        this.passKey
      )
    );
  }

  fetchAccounts() {
    return fetchAndDecryptOne<ThanosAccount[]>(accountsStrgKey, this.passKey);
  }

  async fetchSettings() {
    let saved;
    try {
      saved = await fetchAndDecryptOne<ThanosSettings>(
        settingsStrgKey,
        this.passKey
      );
    } catch {}
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  }

  async getAllDApps() {
    try {
      return await fetchAndDecryptOne<Record<string, ThanosDAppSession>>(
        dAppsStrgKey,
        this.passKey
      );
    } catch {
      return {};
    }
  }

  async getDApp(origin: string) {
    try {
      return (await this.getAllDApps())[origin];
    } catch {
      return undefined;
    }
  }

  async setDApp(origin: string, permissions: ThanosDAppSession) {
    return withError("Failed to update permissions", async () => {
      const current = await this.getAllDApps();
      const newDApps = { ...current, [origin]: permissions };
      await encryptAndSaveMany([[dAppsStrgKey, newDApps]], this.passKey);
      return newDApps;
    });
  }

  async removeDApp(origin: string) {
    return withError("Failed to remove permissions", async () => {
      const {
        [origin]: permissionsToRemove,
        ...restDApps
      } = await this.getAllDApps();
      await encryptAndSaveMany([[dAppsStrgKey, restDApps]], this.passKey);
      return restDApps;
    });
  }

  async cleanDApps() {
    return withError("Failed to reset permissions", () => {
      return encryptAndSaveMany([[dAppsStrgKey, {}]], this.passKey);
    });
  }

  async createHDAccount(name?: string) {
    return withError("Failed to create account", async () => {
      const [mnemonic, allAccounts] = await Promise.all([
        fetchAndDecryptOne<string>(mnemonicStrgKey, this.passKey),
        this.fetchAccounts(),
      ]);

      const seed = Bip39.mnemonicToSeedSync(mnemonic);
      const allHDAccounts = allAccounts.filter(
        (a) => a.type === ThanosAccountType.HD
      );
      const hdAccIndex = allHDAccounts.length;
      const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
      const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(
        accPrivateKey
      );

      const newAccount: ThanosAccount = {
        type: ThanosAccountType.HD,
        name: name || getNewAccountName(allAccounts),
        publicKeyHash: accPublicKeyHash,
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
          [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
          [accountsStrgKey, newAllAcounts],
        ],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async importAccount(accPrivateKey: string, encPassword?: string) {
    const errMessage =
      "Failed to import account" +
      ".\nThis may happen because provided Key is invalid";

    return withError(errMessage, async () => {
      const allAccounts = await this.fetchAccounts();
      const signer = await createMemorySigner(accPrivateKey, encPassword);
      const [
        realAccPrivateKey,
        accPublicKey,
        accPublicKeyHash,
      ] = await Promise.all([
        signer.secretKey(),
        signer.publicKey(),
        signer.publicKeyHash(),
      ]);

      const newAccount: ThanosAccount = {
        type: ThanosAccountType.Imported,
        name: getNewAccountName(allAccounts),
        publicKeyHash: accPublicKeyHash,
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPrivKeyStrgKey(accPublicKeyHash), realAccPrivateKey],
          [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
          [accountsStrgKey, newAllAcounts],
        ],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async importMnemonicAccount(
    mnemonic: string,
    password?: string,
    derivationPath?: string
  ) {
    return withError("Failed to import account", async () => {
      let seed;
      try {
        seed = Bip39.mnemonicToSeedSync(mnemonic, password);
      } catch (_err) {
        throw new PublicError("Invalid Mnemonic or Password");
      }

      if (derivationPath) {
        seed = deriveSeed(seed, derivationPath);
      }

      const privateKey = seedToPrivateKey(seed);
      return this.importAccount(privateKey);
    });
  }

  async importFundraiserAccount(
    email: string,
    password: string,
    mnemonic: string
  ) {
    return withError("Failed to import fundraiser account", async () => {
      const seed = Bip39.mnemonicToSeedSync(mnemonic, `${email}${password}`);
      const privateKey = seedToPrivateKey(seed);
      return this.importAccount(privateKey);
    });
  }

  async editAccountName(accPublicKeyHash: string, name: string) {
    return withError("Failed to edit account name", async () => {
      const allAccounts = await this.fetchAccounts();
      if (!allAccounts.some((acc) => acc.publicKeyHash === accPublicKeyHash)) {
        throw new PublicError("Account not found");
      }

      if (
        allAccounts.some(
          (acc) => acc.publicKeyHash !== accPublicKeyHash && acc.name === name
        )
      ) {
        throw new PublicError("Account with same name already exist");
      }

      const newAllAcounts = allAccounts.map((acc) =>
        acc.publicKeyHash === accPublicKeyHash ? { ...acc, name } : acc
      );
      await encryptAndSaveMany(
        [[accountsStrgKey, newAllAcounts]],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async updateSettings(settings: Partial<ThanosSettings>) {
    return withError("Failed to update settings", async () => {
      const current = await this.fetchSettings();
      const newSettings = { ...current, ...settings };
      await encryptAndSaveMany([[settingsStrgKey, newSettings]], this.passKey);
      return newSettings;
    });
  }

  async sign(accPublicKeyHash: string, bytes: string, watermark?: string) {
    return withError("Failed to sign", async () => {
      const privateKey = await fetchAndDecryptOne<string>(
        accPrivKeyStrgKey(accPublicKeyHash),
        this.passKey
      );
      const signer = await createMemorySigner(privateKey);
      const watermarkBuf =
        watermark && (TaquitoUtils.hex2buf(watermark) as any);
      return signer.sign(bytes, watermarkBuf);
    });
  }

  async sendOperations(accPublicKeyHash: string, rpc: string, opParams: any[]) {
    const batch = await withError("Failed to send operations", async () => {
      const privateKey = await fetchAndDecryptOne<string>(
        accPrivKeyStrgKey(accPublicKeyHash),
        this.passKey
      );
      const signer = await createMemorySigner(privateKey);
      const tezos = new TezosToolkit();
      const forger = new CompositeForger([
        tezos.getFactory(RpcForger)(),
        localForger,
      ]);
      tezos.setProvider({ rpc, signer, forger });
      return tezos.batch(opParams.map(formatOpParams));
    });

    try {
      return await batch.send();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      throw new Error(`__tezos__${err.message}`);
    }
  }
}

/**
 * Migrations
 *
 * -> -> ->
 */

const MIGRATIONS = [
  // [0] Fix derivation
  async (passKey: CryptoKey) => {
    const [mnemonic, accounts] = await Promise.all([
      fetchAndDecryptOne<string>(mnemonicStrgKey, passKey),
      fetchAndDecryptOne<ThanosAccount[]>(accountsStrgKey, passKey),
    ]);
    const migratedAccounts = accounts.map((acc) =>
      acc.type === ThanosAccountType.HD
        ? {
            ...acc,
            type: ThanosAccountType.Imported,
          }
        : acc
    );

    const seed = Bip39.mnemonicToSeedSync(mnemonic);
    const hdAccIndex = 0;
    const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
    const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(
      accPrivateKey
    );

    const newInitialAccount: ThanosAccount = {
      type: ThanosAccountType.HD,
      name: getNewAccountName(accounts),
      publicKeyHash: accPublicKeyHash,
    };
    const newAccounts = [newInitialAccount, ...migratedAccounts];

    await encryptAndSaveMany(
      [
        [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
        [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
        [accountsStrgKey, newAccounts],
      ],
      passKey
    );
  },
];

/**
 * Misc
 */

function formatOpParams(params: any) {
  if (params.kind === "origination" && params.script) {
    const newParams = { ...params, ...params.script };
    newParams.init = newParams.storage;
    delete newParams.script;
    delete newParams.storage;
    return newParams;
  }
  return params;
}

function concatAccount(current: ThanosAccount[], newOne: ThanosAccount) {
  if (current.every((a) => a.publicKeyHash !== newOne.publicKeyHash)) {
    return [...current, newOne];
  }

  throw new PublicError("Account already exists");
}

function getNewAccountName(allAccounts: ThanosAccount[]) {
  return `Account ${allAccounts.length + 1}`;
}

async function getPublicKeyAndHash(privateKey: string) {
  const signer = await createMemorySigner(privateKey);
  return Promise.all([signer.publicKey(), signer.publicKeyHash()]);
}

async function createMemorySigner(privateKey: string, encPassword?: string) {
  return InMemorySigner.fromSecretKey(privateKey, encPassword);
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
    const { key } = Ed25519.derivePath(derivationPath, seed.toString("hex"));
    return key;
  } catch (_err) {
    throw new PublicError("Invalid derivation path");
  }
}

function createStorageKey(id: StorageEntity) {
  return combineStorageKey(STORAGE_KEY_PREFIX, id);
}

function createDynamicStorageKey(id: StorageEntity) {
  const keyBase = combineStorageKey(STORAGE_KEY_PREFIX, id);
  return (...subKeys: (number | string)[]) =>
    combineStorageKey(keyBase, ...subKeys);
}

function combineStorageKey(...parts: (string | number)[]) {
  return parts.join("_");
}

async function withError<T>(
  errMessage: string,
  factory: (doThrow: () => void) => Promise<T>
) {
  try {
    return await factory(() => {
      throw new Error("<stub>");
    });
  } catch (err) {
    throw err instanceof PublicError ? err : new Error(errMessage);
  }
}

class PublicError extends Error {}
