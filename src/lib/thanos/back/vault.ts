import sodium from "libsodium-wrappers";
import * as Bip39 from "bip39";
import * as Bip32 from "bip32";
import * as TaquitoUtils from "@taquito/utils";
import { InMemorySigner } from "@taquito/signer";
import * as Passworder from "lib/passworder";
import { ThanosAccount, ThanosAccountType } from "lib/thanos/types";
import {
  isStored,
  fetchAndDecryptOne,
  encryptAndSaveMany
} from "lib/thanos/back/safe-storage";

// const STORAGE_KEY_PREFIX = "encstrg";

// enum StorageEntityId {
//   // Attension!
//   // Security stuff!
//   // Don't change this enum!
//   // Only add new parts!
//   Check = "check",
//   Mnemonic = "mnemonic",
//   Accounts = "accounts",
//   AccKey = "acckey"
// }

// `Sterm` is `Storage Term` :$
enum Sterm {
  Vault = "vault",
  Salt = "salt",
  Check = "check",
  Mnemonic = "mnemonic",
  Accounts = "accounts",
  AccKey = "acckey"
}

const TEZOS_BIP44_COINTYPE = 1729;
const CHECK_STERM = deriveVaultSterm(Sterm.Check);
const MNEMONIC_STERM = deriveVaultSterm(Sterm.Mnemonic);
const ACCOUNTS_STERM = deriveVaultSterm(Sterm.Accounts);
const ACC_KEY_STERM = deriveVaultSterm(Sterm.AccKey);

export class Vault {
  static isExist() {
    return isStored(CHECK_STERM);
  }

  static async setup(password: string) {
    const passKey = await Passworder.generateKey(password);
    await fetchAndDecryptOne(CHECK_STERM, passKey);

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

    const passKey = await Passworder.generateKey(password);

    await encryptAndSaveMany(
      [
        [CHECK_STERM, null],
        [MNEMONIC_STERM, mnemonic],
        [deriveVaultSterm(ACC_KEY_STERM, firstAccIndex), firstAccPrivateKey],
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
    return fetchAndDecryptOne<string>(MNEMONIC_STERM, passKey);
  }

  fetchAccounts() {
    return fetchAndDecryptOne<ThanosAccount[]>(ACCOUNTS_STERM, this.passKey);
  }

  async createHDAccount() {
    const [mnemonic, allAccounts] = await Promise.all([
      fetchAndDecryptOne<string>(MNEMONIC_STERM, this.passKey),
      fetchAndDecryptOne<ThanosAccount[]>(ACCOUNTS_STERM, this.passKey)
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
    const newAllAcounts = [...allAccounts, newAccount];

    await encryptAndSaveMany(
      [
        [deriveVaultSterm(ACC_KEY_STERM, newAccIndex), newHDAccPrivateKey],
        [ACCOUNTS_STERM, newAllAcounts]
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
    const newAllAcounts = [...allAccounts, newAccount];

    await encryptAndSaveMany(
      [
        [deriveVaultSterm(ACC_KEY_STERM, newAccIndex), privateKey],
        [ACCOUNTS_STERM, newAllAcounts]
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
    await encryptAndSaveMany([[ACCOUNTS_STERM, newAllAcounts]], this.passKey);

    return newAllAcounts;
  }
}

async function getPublicKeyHash(privateKey: string) {
  const signer = await createMemorySigner(privateKey);
  return signer.publicKeyHash();
}

async function createMemorySigner(privateKey: string) {
  await sodium.ready;
  return new InMemorySigner(privateKey);
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

function deriveVaultSterm(...parts: (string | number)[]) {
  return [Sterm.Vault, ...parts].join("_");
}
