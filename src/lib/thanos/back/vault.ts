import { Storage, browser } from "webextension-polyfill-ts";
import { Buffer } from "buffer";
import * as Bip39 from "bip39";
import * as Bip32 from "bip32";
import * as TaquitoUtils from "@taquito/utils";
import { InMemorySigner } from "@taquito/signer";
import * as Passworder from "lib/passworder";
import { ThanosAccount, ThanosAccountType } from "lib/thanos/types";

// `Sterm` is `Storage Term` :$
enum Sterm {
  Vault = "vault",
  Salt = "salt",
  Check = "check",
  Mnemonic = "mnemonic",
  Accounts = "accounts",
  HDAccKey = "hdacckey"
}

const TEZOS_BIP44_COINTYPE = 1729;
const SALT_STERM = deriveVaultSterm(Sterm.Salt);
const CHECK_STERM = deriveVaultSterm(Sterm.Check);
const MNEMONIC_STERM = deriveVaultSterm(Sterm.Mnemonic);
const ACCOUNTS_STERM = deriveVaultSterm(Sterm.Accounts);
const HDACC_KEY_STERM = deriveVaultSterm(Sterm.HDAccKey);

export class Vault {
  static async isExist() {
    try {
      await fetchStorage(CHECK_STERM);
      return true;
    } catch (_err) {
      return false;
    }
  }

  static async setup(password: string) {
    const passKey = await Passworder.generateKey(password);
    await fetchAndDecrypt(CHECK_STERM, passKey);

    return new Vault(passKey);
  }

  static async spawn(password: string, mnemonic?: string) {
    if (!mnemonic) {
      mnemonic = Bip39.generateMnemonic(128);
    }
    const seed = Bip39.mnemonicToSeedSync(mnemonic);

    const firstHDAccIndex = 0;
    const firstHDAccPrivateKey = seedToHDPrivateKey(seed, firstHDAccIndex);

    const initialAccount: ThanosAccount = {
      type: ThanosAccountType.HD,
      name: "Account 1",
      publicKeyHash: await getPublicKeyHash(firstHDAccPrivateKey)
    };

    const passKey = await Passworder.generateKey(password);
    await setupSalt();

    await encryptAndSave(
      [
        [CHECK_STERM, null],
        [MNEMONIC_STERM, mnemonic],
        [
          deriveVaultSterm(HDACC_KEY_STERM, firstHDAccIndex),
          firstHDAccPrivateKey
        ],
        [ACCOUNTS_STERM, [initialAccount]]
      ],
      passKey
    );
  }

  private passKey: CryptoKey;

  constructor(passKey: CryptoKey) {
    this.passKey = passKey;
  }

  async revealMnemonic(password: string) {
    const passKey = await Passworder.generateKey(password);
    return fetchAndDecrypt<string>(MNEMONIC_STERM, passKey);
  }

  fetchAccounts() {
    return fetchAndDecrypt<ThanosAccount[]>(ACCOUNTS_STERM, this.passKey);
  }

  async createHDAccount() {
    const [mnemonic, allAccounts] = await fetchAndDecrypt<
      [string, ThanosAccount[]]
    >([MNEMONIC_STERM, ACCOUNTS_STERM], this.passKey);

    const seed = Bip39.mnemonicToSeedSync(mnemonic);
    const allHDAccounts = allAccounts.filter(
      a => a.type === ThanosAccountType.HD
    );
    const newHDAccIndex = allHDAccounts.length;
    const newHDAccPrivateKey = seedToHDPrivateKey(seed, newHDAccIndex);

    const newAccount: ThanosAccount = {
      type: ThanosAccountType.HD,
      name: `Account ${allAccounts.length + 1}`,
      publicKeyHash: await getPublicKeyHash(newHDAccPrivateKey)
    };
    const newAllAcounts = [...allAccounts, newAccount];

    await encryptAndSave(
      [
        [deriveVaultSterm(HDACC_KEY_STERM, newHDAccIndex), newHDAccPrivateKey],
        [ACCOUNTS_STERM, newAllAcounts]
      ],
      this.passKey
    );

    return newAllAcounts;
  }

  async editAccountName(accIndex: number, name: string) {
    const allAccounts = await this.fetchAccounts();
    if (!(accIndex in allAccounts)) {
      throw new Error("Account not found");
    }

    if (allAccounts.some((acc, i) => i !== accIndex && acc.name === name)) {
      throw new Error("Account with same name already exist");
    }

    const newAllAcounts = allAccounts.map((acc, i) =>
      i === accIndex ? { ...acc, name } : acc
    );
    await encryptAndSave([[ACCOUNTS_STERM, newAllAcounts]], this.passKey);

    return newAllAcounts;
  }
}

function getPublicKeyHash(privateKey: string) {
  const signer = new InMemorySigner(privateKey);
  return signer.publicKeyHash();
}

function seedToHDPrivateKey(seed: Buffer, account: number) {
  const keyNode = Bip32.fromSeed(seed);
  const keyChild = keyNode.derivePath(
    `m/44'/${TEZOS_BIP44_COINTYPE}'/${account}'/0/0`
  );

  return TaquitoUtils.b58cencode(
    keyChild.privateKey!.slice(0, 32),
    TaquitoUtils.prefix.edsk2
  );
}

async function fetchAndDecrypt<T>(
  itemKeys: string[] | string,
  passKey: CryptoKey
) {
  let oneItem = false;
  if (!Array.isArray(itemKeys)) {
    itemKeys = [itemKeys];
    oneItem = true;
  }

  const encItems = await fetchStorage<Passworder.EncryptedPayload[]>(itemKeys);
  const salt = await fetchSalt();
  const derivedPassKey = await Passworder.deriveKey(passKey, salt);
  const items = await Promise.all(
    encItems.map(enc => Passworder.decrypt(enc, derivedPassKey))
  );

  return (oneItem ? items[0] : items) as T;
}

async function encryptAndSave(items: [string, any][], passKey: CryptoKey) {
  const salt = await fetchSalt();
  const derivedPassKey = await Passworder.deriveKey(passKey, salt);
  const encItems = await Promise.all(
    items.map(([_k, stuff]) => Passworder.encrypt(stuff, derivedPassKey))
  );

  const itemsToSave: { [key: string]: Passworder.EncryptedPayload } = {};
  items.forEach(([key], i) => {
    itemsToSave[key] = encItems[i];
  });

  await saveStorage(itemsToSave);
}

async function fetchSalt() {
  const saltHex = await fetchStorage<string>(SALT_STERM);
  return Buffer.from(saltHex, "hex");
}

async function setupSalt() {
  const salt = Passworder.generateSalt();
  const saltHex = Buffer.from(salt).toString("hex");
  await saveStorage({ [SALT_STERM]: saltHex });
}

function deriveVaultSterm(...parts: (string | number)[]) {
  return [Sterm.Vault, ...parts].join("_");
}

async function fetchStorage<T>(itemKeys: string[] | string) {
  let oneItem = false;
  if (!Array.isArray(itemKeys)) {
    itemKeys = [itemKeys];
    oneItem = true;
  }

  const savedItems = await browser.storage.local.get(itemKeys);
  if (itemKeys.every(key => key in savedItems)) {
    const items = itemKeys.map(key => savedItems[key]);
    return (oneItem ? items[0] : items) as T;
  } else {
    throw new Error("Some storage item not found");
  }
}

async function saveStorage(items: Storage.StorageAreaSetItemsType) {
  await browser.storage.local.set(items);
}
