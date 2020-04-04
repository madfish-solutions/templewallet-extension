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
  AccPrivKey = "accprivkey",
  AccPubKey = "accpubkey",
  Accounts = "accounts"
}

const checkStrgKey = createStorageKey(StorageEntity.Check);
const mnemonicStrgKey = createStorageKey(StorageEntity.Mnemonic);
const accPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPrivKey);
const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
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

    const hdAccIndex = 0;
    const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
    const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(
      accPrivateKey
    );

    const initialAccount: ThanosAccount = {
      type: ThanosAccountType.HD,
      name: "Account 1",
      publicKeyHash: accPublicKeyHash
    };
    const newAccounts = [initialAccount];

    const passKey = await Passworder.generateKey(password);

    await encryptAndSaveMany(
      [
        [checkStrgKey, null],
        [mnemonicStrgKey, mnemonic],
        [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
        [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
        [accountsStrgKey, newAccounts]
      ],
      passKey
    );
  }

  private passKey: CryptoKey;

  constructor(passKey: CryptoKey) {
    this.passKey = passKey;
  }

  revealPublicKey(accPublicKeyHash: string) {
    return fetchAndDecryptOne<string>(
      accPubKeyStrgKey(accPublicKeyHash),
      this.passKey
    );
  }

  async revealPrivateKey(accPublicKeyHash: string, password: string) {
    const passKey = await Passworder.generateKey(password);
    return fetchAndDecryptOne<string>(
      accPrivKeyStrgKey(accPublicKeyHash),
      passKey
    );
  }

  async revealMnemonic(password: string) {
    const passKey = await Passworder.generateKey(password);
    return fetchAndDecryptOne<string>(mnemonicStrgKey, passKey);
  }

  fetchAccounts() {
    return fetchAndDecryptOne<ThanosAccount[]>(accountsStrgKey, this.passKey);
  }

  async createHDAccount(password: string) {
    const passKey = await Passworder.generateKey(password);
    const [mnemonic, allAccounts] = await Promise.all([
      fetchAndDecryptOne<string>(mnemonicStrgKey, passKey),
      fetchAndDecryptOne<ThanosAccount[]>(accountsStrgKey, passKey)
    ]);

    const seed = Bip39.mnemonicToSeedSync(mnemonic);
    const allHDAccounts = allAccounts.filter(
      a => a.type === ThanosAccountType.HD
    );
    const hdAccIndex = allHDAccounts.length;
    const accPrivateKey = seedToHDPrivateKey(seed, hdAccIndex);
    const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(
      accPrivateKey
    );

    const newAccount: ThanosAccount = {
      type: ThanosAccountType.HD,
      name: this.getNewAccountName(allAccounts),
      publicKeyHash: accPublicKeyHash
    };
    const newAllAcounts = this.concatAccount(allAccounts, newAccount);

    await encryptAndSaveMany(
      [
        [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
        [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
        [accountsStrgKey, newAllAcounts]
      ],
      passKey
    );

    return newAllAcounts;
  }

  async importAccount(accPrivateKey: string) {
    const allAccounts = await this.fetchAccounts();

    const [accPublicKey, accPublicKeyHash] = await getPublicKeyAndHash(
      accPrivateKey
    );

    const newAccount: ThanosAccount = {
      type: ThanosAccountType.Imported,
      name: this.getNewAccountName(allAccounts),
      publicKeyHash: accPublicKeyHash
    };
    const newAllAcounts = this.concatAccount(allAccounts, newAccount);

    await encryptAndSaveMany(
      [
        [accPrivKeyStrgKey(accPublicKeyHash), accPrivateKey],
        [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
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

  async editAccountName(accPublicKeyHash: string, name: string) {
    const allAccounts = await this.fetchAccounts();
    if (!allAccounts.some(acc => acc.publicKeyHash === accPublicKeyHash)) {
      throw new Error("Account not found");
    }

    if (
      allAccounts.some(
        acc => acc.publicKeyHash !== accPublicKeyHash && acc.name === name
      )
    ) {
      throw new Error("Account with same name already exist");
    }

    const newAllAcounts = allAccounts.map(acc =>
      acc.publicKeyHash === accPublicKeyHash ? { ...acc, name } : acc
    );
    await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

    return newAllAcounts;
  }

  async sign(accPublicKeyHash: string, bytes: string, watermark?: string) {
    const privateKey = await fetchAndDecryptOne<string>(
      accPrivKeyStrgKey(accPublicKeyHash),
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

  private getNewAccountName(allAccounts: ThanosAccount[]) {
    return `Account ${allAccounts.length + 1}`;
  }
}

async function getPublicKeyAndHash(privateKey: string) {
  const signer = await createMemorySigner(privateKey);
  return Promise.all([signer.publicKey(), signer.publicKeyHash()]);
}

async function createMemorySigner(privateKey: string) {
  return InMemorySigner.fromSecretKey(privateKey);
}

function seedToHDPrivateKey(seed: Buffer, hdAccIndex: number) {
  const keyNode = Bip32.fromSeed(seed);
  const keyChild = keyNode.derivePath(
    `m/44'/${TEZOS_BIP44_COINTYPE}'/${hdAccIndex}'/0/0`
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
