import * as Bip39 from "bip39";
import * as Bip32 from "bip32";
import * as TaquitoUtils from "@taquito/utils";
import { InMemorySigner } from "@taquito/signer";
import * as Passworder from "lib/thanos/passworder";
import { ThanosAccount, ThanosAccountType } from "lib/thanos/types";
import {
  isStored,
  fetchAndDecryptOne,
  encryptAndSaveMany
} from "lib/thanos/back/safe-storage";

const TEZOS_BIP44_COINTYPE = 1729;
const STORAGE_KEY_PREFIX = "vault";

enum StorageEntity {
  Check = "check",
  Mnemonic = "mnemonic",
  AccKey = "acckey",
  Accounts = "accounts"
}

const checkStrgKey = createStorageKey(StorageEntity.Check);
const mnemonicStrgKey = createStorageKey(StorageEntity.Mnemonic);
const accKeyStrgKey = createDynamicStorageKey(StorageEntity.AccKey);
const accountsStrgKey = createStorageKey(StorageEntity.Accounts);

export class Vault {
  static isExist() {
    return isStored(checkStrgKey);
  }

  static async setup(password: string) {
    const passKey = await Passworder.generateKey(password);
    await fetchAndDecryptOne(checkStrgKey, passKey);

    return new Vault(passKey);
  }

  static async spawn(password: string, mnemonic?: string) {
    if (!mnemonic) {
      mnemonic = Bip39.generateMnemonic(128);
    }
    const seed = Bip39.mnemonicToSeedSync(mnemonic);

    const firstAccIndex = 0;
    const firstAccPrivateKey = seedToHDPrivateKey(seed, firstAccIndex);

    const initialAccount: ThanosAccount = {
      type: ThanosAccountType.HD,
      name: "Account 1",
      publicKeyHash: await getPublicKeyHash(firstAccPrivateKey)
    };
    const newAccounts = [initialAccount];

    const passKey = await Passworder.generateKey(password);

    await encryptAndSaveMany(
      [
        [checkStrgKey, null],
        [mnemonicStrgKey, mnemonic],
        [accKeyStrgKey(firstAccIndex), firstAccPrivateKey],
        [accountsStrgKey, newAccounts]
      ],
      passKey
    );
  }

  private passKey: CryptoKey;

  constructor(passKey: CryptoKey) {
    this.passKey = passKey;
  }

  async revealPublicKey(accIndex: number) {
    const privateKey = await fetchAndDecryptOne<string>(
      accKeyStrgKey(accIndex),
      this.passKey
    );
    return getPublicKey(privateKey);
  }

  async revealPrivateKey(accIndex: number, password: string) {
    const passKey = await Passworder.generateKey(password);
    return fetchAndDecryptOne<string>(accKeyStrgKey(accIndex), passKey);
  }

  async revealMnemonic(password: string) {
    const passKey = await Passworder.generateKey(password);
    return fetchAndDecryptOne<string>(mnemonicStrgKey, passKey);
  }

  fetchAccounts() {
    return fetchAndDecryptOne<ThanosAccount[]>(accountsStrgKey, this.passKey);
  }

  async createHDAccount() {
    const [mnemonic, allAccounts] = await Promise.all([
      fetchAndDecryptOne<string>(mnemonicStrgKey, this.passKey),
      fetchAndDecryptOne<ThanosAccount[]>(accountsStrgKey, this.passKey)
    ]);

    const seed = Bip39.mnemonicToSeedSync(mnemonic);
    const allHDAccounts = allAccounts.filter(
      a => a.type === ThanosAccountType.HD
    );
    const newHDAccIndex = allHDAccounts.length;
    const newHDAccPrivateKey = seedToHDPrivateKey(seed, newHDAccIndex);

    const newAccIndex = allAccounts.length;
    const newAccount: ThanosAccount = {
      type: ThanosAccountType.HD,
      name: `Account ${newAccIndex + 1}`,
      publicKeyHash: await getPublicKeyHash(newHDAccPrivateKey)
    };
    const newAllAcounts = this.concatAccount(allAccounts, newAccount);

    await encryptAndSaveMany(
      [
        [accKeyStrgKey(newAccIndex), newHDAccPrivateKey],
        [accountsStrgKey, newAllAcounts]
      ],
      this.passKey
    );

    return newAllAcounts;
  }

  async importAccount(privateKey: string) {
    const allAccounts = await this.fetchAccounts();

    const newAccIndex = allAccounts.length;
    const newAccount: ThanosAccount = {
      type: ThanosAccountType.Imported,
      name: `Account ${newAccIndex + 1}`,
      publicKeyHash: await getPublicKeyHash(privateKey)
    };
    const newAllAcounts = this.concatAccount(allAccounts, newAccount);

    await encryptAndSaveMany(
      [
        [accKeyStrgKey(newAccIndex), privateKey],
        [accountsStrgKey, newAllAcounts]
      ],
      this.passKey
    );

    return newAllAcounts;
  }

  async importFundraiserAccount(
    email: string,
    password: string,
    mnemonic: string
  ) {
    const seed = Bip39.mnemonicToSeedSync(mnemonic, `${email}${password}`);
    const privateKey = TaquitoUtils.b58cencode(
      seed.slice(0, 32),
      TaquitoUtils.prefix.edsk2
    );

    return this.importAccount(privateKey);
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
    await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

    return newAllAcounts;
  }

  async sign(accIndex: number, bytes: string, watermark?: string) {
    const privateKey = await fetchAndDecryptOne<string>(
      accKeyStrgKey(accIndex),
      this.passKey
    );
    const signer = await createMemorySigner(privateKey);
    const watermarkBuf = watermark && (TaquitoUtils.hex2buf(watermark) as any);
    return signer.sign(bytes, watermarkBuf);
  }

  private concatAccount(current: ThanosAccount[], newOne: ThanosAccount) {
    if (current.every(a => a.publicKeyHash !== newOne.publicKeyHash)) {
      return [...current, newOne];
    }

    throw new Error("Account already exists");
  }
}

async function getPublicKey(privateKey: string) {
  const signer = await createMemorySigner(privateKey);
  return signer.publicKey();
}

async function getPublicKeyHash(privateKey: string) {
  const signer = await createMemorySigner(privateKey);
  return signer.publicKeyHash();
}

async function createMemorySigner(privateKey: string) {
  return InMemorySigner.fromSecretKey(privateKey);
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

function createStorageKey(id: StorageEntity) {
  return combineStorageKey(STORAGE_KEY_PREFIX, id);
}

function createDynamicStorageKey(id: StorageEntity) {
  const keyBase = combineStorageKey(STORAGE_KEY_PREFIX, id);
  return (subKey: number | string) => combineStorageKey(keyBase, subKey);
}

function combineStorageKey(...parts: (string | number)[]) {
  return parts.join("_");
}
