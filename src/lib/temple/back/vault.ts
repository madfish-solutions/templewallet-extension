import LedgerTransport from "@ledgerhq/hw-transport";
import { HttpResponseError } from "@taquito/http-utils";
import { DerivationType } from "@taquito/ledger-signer";
import { localForger } from "@taquito/local-forging";
import { InMemorySigner } from "@taquito/signer";
import {
  TezosToolkit,
  CompositeForger,
  RpcForger,
  Signer,
  TezosOperationError,
  BatchOperation,
} from "@taquito/taquito";
import * as TaquitoUtils from "@taquito/utils";
import { LedgerTempleBridgeTransport } from "@temple-wallet/ledger-bridge";
import * as Bip39 from "bip39";
import * as Ed25519 from "ed25519-hd-key";
import memoize from "mem";
import { browser } from "webextension-polyfill-ts";

import { getMessage } from "lib/i18n";
import { mergeAssets } from "lib/temple/assets";
import { PublicError } from "lib/temple/back/defaults";
import { TempleLedgerSigner } from "lib/temple/back/ledger-signer";
import {
  isStored,
  fetchAndDecryptOne,
  encryptAndSaveMany,
  removeMany,
} from "lib/temple/back/safe-storage";
import {
  transformHttpResponseError,
  loadChainId,
  formatOpParamsBeforeSend,
  michelEncoder,
  loadFastRpcClient,
} from "lib/temple/helpers";
import { NETWORKS } from "lib/temple/networks";
import * as Passworder from "lib/temple/passworder";
import {
  TempleAccount,
  TempleAccountType,
  TempleSettings,
  TempleToken,
} from "lib/temple/types";

const TEZOS_BIP44_COINTYPE = 1729;
const STORAGE_KEY_PREFIX = "vault";
const DEFAULT_SETTINGS: TempleSettings = {};

enum StorageEntity {
  Check = "check",
  MigrationLevel = "mgrnlvl",
  Mnemonic = "mnemonic",
  AccPrivKey = "accprivkey",
  AccPubKey = "accpubkey",
  Accounts = "accounts",
  Settings = "settings",
}

const checkStrgKey = createStorageKey(StorageEntity.Check);
const migrationLevelStrgKey = createStorageKey(StorageEntity.MigrationLevel);
const mnemonicStrgKey = createStorageKey(StorageEntity.Mnemonic);
const accPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPrivKey);
const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
const accountsStrgKey = createStorageKey(StorageEntity.Accounts);
const settingsStrgKey = createStorageKey(StorageEntity.Settings);

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

      const initialAccount: TempleAccount = {
        type: TempleAccountType.HD,
        name: "Account 1",
        publicKeyHash: accPublicKeyHash,
        hdIndex: hdAccIndex,
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
    return withError("Failed to reveal private key", async () => {
      const privateKeySeed = await fetchAndDecryptOne<string>(
        accPrivKeyStrgKey(accPublicKeyHash),
        passKey
      );
      const signer = await createMemorySigner(privateKeySeed);
      return signer.secretKey();
    });
  }

  static async removeAccount(accPublicKeyHash: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError("Failed to remove account", async (doThrow) => {
      const allAccounts = await fetchAndDecryptOne<TempleAccount[]>(
        accountsStrgKey,
        passKey
      );
      const acc = allAccounts.find((a) => a.publicKeyHash === accPublicKeyHash);
      if (!acc || acc.type === TempleAccountType.HD) {
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
    return fetchAndDecryptOne<TempleAccount[]>(accountsStrgKey, this.passKey);
  }

  async fetchSettings() {
    let saved;
    try {
      saved = await fetchAndDecryptOne<TempleSettings>(
        settingsStrgKey,
        this.passKey
      );
    } catch {}
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  }

  async createHDAccount(
    name?: string,
    hdAccIndex?: number
  ): Promise<TempleAccount[]> {
    return withError("Failed to create account", async () => {
      const [mnemonic, allAccounts] = await Promise.all([
        fetchAndDecryptOne<string>(mnemonicStrgKey, this.passKey),
        this.fetchAccounts(),
      ]);

      const seed = Bip39.mnemonicToSeedSync(mnemonic);

      if (!hdAccIndex) {
        const allHDAccounts = allAccounts.filter(
          (a) => a.type === TempleAccountType.HD
        );
        hdAccIndex = allHDAccounts.length;
      }

      const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
      const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(
        accPrivateKey
      );
      const accName = name || getNewAccountName(allAccounts);

      if (allAccounts.some((a) => a.publicKeyHash === accPublicKeyHash)) {
        return this.createHDAccount(accName, hdAccIndex + 1);
      }

      const newAccount: TempleAccount = {
        type: TempleAccountType.HD,
        name: accName,
        publicKeyHash: accPublicKeyHash,
        hdIndex: hdAccIndex,
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
      const [realAccPrivateKey, accPublicKey, accPublicKeyHash] =
        await Promise.all([
          signer.secretKey(),
          signer.publicKey(),
          signer.publicKeyHash(),
        ]);

      const newAccount: TempleAccount = {
        type: TempleAccountType.Imported,
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

  async importManagedKTAccount(
    accPublicKeyHash: string,
    chainId: string,
    owner: string
  ) {
    return withError("Failed to import Managed KT account", async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: TempleAccount = {
        type: TempleAccountType.ManagedKT,
        name: getNewAccountName(
          allAccounts.filter(
            ({ type }) => type === TempleAccountType.ManagedKT
          ),
          "defaultManagedKTAccountName"
        ),
        publicKeyHash: accPublicKeyHash,
        chainId,
        owner,
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [[accountsStrgKey, newAllAcounts]],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async importWatchOnlyAccount(accPublicKeyHash: string, chainId?: string) {
    return withError("Failed to import Watch Only account", async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: TempleAccount = {
        type: TempleAccountType.WatchOnly,
        name: getNewAccountName(
          allAccounts.filter(
            ({ type }) => type === TempleAccountType.WatchOnly
          ),
          "defaultWatchOnlyAccountName"
        ),
        publicKeyHash: accPublicKeyHash,
        chainId,
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [[accountsStrgKey, newAllAcounts]],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async createLedgerAccount(
    name: string,
    derivationPath?: string,
    derivationType?: DerivationType
  ) {
    return withError("Failed to connect Ledger account", async () => {
      if (!derivationPath) derivationPath = getMainDerivationPath(0);

      const { signer, cleanup } = await createLedgerSigner(
        derivationPath,
        derivationType
      );

      try {
        const accPublicKey = await signer.publicKey();
        const accPublicKeyHash = await signer.publicKeyHash();

        const newAccount: TempleAccount = {
          type: TempleAccountType.Ledger,
          name,
          publicKeyHash: accPublicKeyHash,
          derivationPath,
          derivationType,
        };
        const allAccounts = await this.fetchAccounts();
        const newAllAcounts = concatAccount(allAccounts, newAccount);

        await encryptAndSaveMany(
          [
            [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
            [accountsStrgKey, newAllAcounts],
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

  async updateSettings(settings: Partial<TempleSettings>) {
    return withError("Failed to update settings", async () => {
      const current = await this.fetchSettings();
      const newSettings = { ...current, ...settings };
      await encryptAndSaveMany([[settingsStrgKey, newSettings]], this.passKey);
      return newSettings;
    });
  }

  async sign(accPublicKeyHash: string, bytes: string, watermark?: string) {
    return withError("Failed to sign", () =>
      this.withSigner(accPublicKeyHash, async (signer) => {
        const watermarkBuf = watermark
          ? TaquitoUtils.hex2buf(watermark)
          : undefined;
        return signer.sign(bytes, watermarkBuf);
      })
    );
  }

  async sendOperations(
    accPublicKeyHash: string,
    rpc: string,
    opParams: any[]
  ): Promise<BatchOperation> {
    return this.withSigner(accPublicKeyHash, async (signer) => {
      const tezos = loadTezosToolkit(rpc);
      const batch = await withError("Failed to send operations", async () => {
        tezos.setSignerProvider(signer);
        return tezos.contract.batch(opParams.map(formatOpParamsBeforeSend));
      });

      try {
        return await batch.send();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        try {
          if (
            err.body.includes("contract.counter_in_the_past") ||
            /Counter.*not yet reached for contract/.test(err.body)
          ) {
            memoize.clear(loadTezosToolkit);
            console.info("RESET");
            return this.sendOperations(accPublicKeyHash, rpc, opParams);
          }
        } catch {}

        switch (true) {
          case err instanceof PublicError:
          case err instanceof TezosOperationError:
            throw err;

          case err instanceof HttpResponseError:
            throw transformHttpResponseError(err);

          default:
            throw new Error(`Failed to send operations. ${err.message}`);
        }
      } finally {
        tezos.setSignerProvider(null as any);
      }
    });
  }

  private async withSigner<T>(
    accPublicKeyHash: string,
    factory: (signer: Signer) => Promise<T>
  ) {
    const { signer, cleanup } = await this.getSigner(accPublicKeyHash);
    try {
      return await factory(signer);
    } finally {
      cleanup();
    }
  }

  private async getSigner(accPublicKeyHash: string) {
    const allAccounts = await this.fetchAccounts();
    const acc = allAccounts.find((a) => a.publicKeyHash === accPublicKeyHash);
    if (!acc) {
      throw new PublicError("Account not found");
    }

    switch (acc.type) {
      case TempleAccountType.Ledger:
        const publicKey = await this.revealPublicKey(accPublicKeyHash);
        return createLedgerSigner(
          acc.derivationPath,
          acc.derivationType,
          publicKey,
          accPublicKeyHash
        );

      case TempleAccountType.WatchOnly:
        throw new PublicError("Cannot sign Watch-only account");

      default:
        const privateKey = await fetchAndDecryptOne<string>(
          accPrivKeyStrgKey(accPublicKeyHash),
          this.passKey
        );
        return createMemorySigner(privateKey).then((signer) => ({
          signer,
          cleanup: () => {},
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
  // [0] Fix derivation
  async (passKey: CryptoKey) => {
    const [mnemonic, accounts] = await Promise.all([
      fetchAndDecryptOne<string>(mnemonicStrgKey, passKey),
      fetchAndDecryptOne<TempleAccount[]>(accountsStrgKey, passKey),
    ]);
    const migratedAccounts = accounts.map((acc) =>
      acc.type === TempleAccountType.HD
        ? {
            ...acc,
            type: TempleAccountType.Imported,
          }
        : acc
    );

    const seed = Bip39.mnemonicToSeedSync(mnemonic);
    const hdAccIndex = 0;
    const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
    const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(
      accPrivateKey
    );

    const newInitialAccount: TempleAccount = {
      type: TempleAccountType.HD,
      name: getNewAccountName(accounts),
      publicKeyHash: accPublicKeyHash,
      hdIndex: hdAccIndex,
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

  // [1] Add hdIndex prop to HD Accounts
  async (passKey: CryptoKey) => {
    const accounts = await fetchAndDecryptOne<TempleAccount[]>(
      accountsStrgKey,
      passKey
    );

    let hdAccIndex = 0;
    const newAccounts = accounts.map((acc) =>
      acc.type === TempleAccountType.HD
        ? { ...acc, hdIndex: hdAccIndex++ }
        : acc
    );

    await encryptAndSaveMany([[accountsStrgKey, newAccounts]], passKey);
  },

  // [2] Improve token managing flow
  // Migrate from tokens{netId}: TempleToken[] + hiddenTokens{netId}: TempleToken[]
  // to tokens{chainId}: TempleToken[]
  async (passKey: CryptoKey) => {
    let savedSettings;
    try {
      savedSettings = await fetchAndDecryptOne<TempleSettings>(
        settingsStrgKey,
        passKey
      );
    } catch {}
    const customNetworks = savedSettings?.customNetworks ?? [];
    const allNetworks = [...NETWORKS, ...customNetworks];
    for (const net of allNetworks) {
      const legacyTokensStrgKey = `tokens_${net.id}`;
      const legacyHiddenTokensStrgKey = `hidden_tokens_${net.id}`;
      const [
        {
          [legacyTokensStrgKey]: legacyTokens = [],
          [legacyHiddenTokensStrgKey]: legacyHiddenTokens = [],
        },
        chainId,
      ] = await Promise.all([
        browser.storage.local.get([
          legacyTokensStrgKey,
          legacyHiddenTokensStrgKey,
        ]),
        loadChainId(net.rpcBaseURL),
      ]);

      const tokensStrgKey = `tokens_${chainId}`;
      const { [tokensStrgKey]: existingTokens = [] } =
        await browser.storage.local.get([tokensStrgKey]);

      await browser.storage.local.set({
        [tokensStrgKey]: mergeAssets(
          existingTokens,
          legacyTokens.map((t: TempleToken) => ({
            ...t,
            status: "displayed",
          })),
          legacyHiddenTokens.map((t: TempleToken) => ({
            ...t,
            status: "hidden",
          }))
        ),
      });
    }
  },
];

/**
 * Misc
 */

const loadTezosToolkit = memoize(createTezosToolkit);

function createTezosToolkit(rpc: string) {
  const tezos = new TezosToolkit(loadFastRpcClient(rpc));
  tezos.setForgerProvider(
    new CompositeForger([tezos.getFactory(RpcForger)(), localForger])
  );
  tezos.setPackerProvider(michelEncoder);
  tezos.setSignerProvider(undefined);
  return tezos;
}

function removeMFromDerivationPath(dPath: string) {
  return dPath.startsWith("m/") ? dPath.substring(2) : dPath;
}

function concatAccount(current: TempleAccount[], newOne: TempleAccount) {
  if (current.every((a) => a.publicKeyHash !== newOne.publicKeyHash)) {
    return [...current, newOne];
  }

  throw new PublicError("Account already exists");
}

function getNewAccountName(
  allAccounts: TempleAccount[],
  templateI18nKey = "defaultAccountName"
) {
  return getMessage(templateI18nKey, String(allAccounts.length + 1));
}

async function getPublicKeyAndHash(privateKey: string) {
  const signer = await createMemorySigner(privateKey);
  return Promise.all([signer.publicKey(), signer.publicKeyHash()]);
}

async function createMemorySigner(privateKey: string, encPassword?: string) {
  return InMemorySigner.fromSecretKey(privateKey, encPassword);
}

let transport: LedgerTransport;

async function createLedgerSigner(
  derivationPath: string,
  derivationType?: DerivationType,
  publicKey?: string,
  publicKeyHash?: string
) {
  if (!transport) {
    const bridgeUrl = process.env.TEMPLE_WALLET_LEDGER_BRIDGE_URL;
    if (!bridgeUrl) {
      throw new Error(
        "Require a 'TEMPLE_WALLET_LEDGER_BRIDGE_URL' environment variable to be set"
      );
    }

    const isWin = (await browser.runtime.getPlatformInfo()).os === "win";

    transport = await LedgerTempleBridgeTransport.open(bridgeUrl);
    if (process.env.TARGET_BROWSER === "chrome" && !isWin) {
      (transport as LedgerTempleBridgeTransport).useLedgerLive();
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
    throw err instanceof PublicError ? err : new PublicError(errMessage);
  }
}
