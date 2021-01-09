import { Buffer } from "buffer";
import * as SafeStorage from "lib/ext/safe-storage";
import * as Passworder from "lib/passworder";

export interface Encrypted {
  payload: Passworder.EncryptedPayload;
  salt: string;
}

export async function fetchAndDecryptOne<T>(
  storageKey: string,
  passKey: CryptoKey
) {
  const encItem = await SafeStorage.fetchOne<Encrypted>(storageKey);
  return decrypt<T>(encItem, passKey);
}

export async function encryptAndSaveMany(
  items: [string, unknown][],
  passKey: CryptoKey
) {
  const encItems = await Promise.all(
    items.map(async ([storageKey, stuff]) => {
      const encItem = await encrypt(stuff, passKey);
      return [storageKey, encItem] as [typeof storageKey, typeof encItem];
    })
  );

  await SafeStorage.putMany(encItems);
}

async function encrypt(stuff: any, passKey: CryptoKey): Promise<Encrypted> {
  const salt = Passworder.generateSalt();
  const derivedPassKey = await Passworder.deriveKey(passKey, salt);
  const payload = await Passworder.encrypt(stuff, derivedPassKey);

  return {
    payload,
    salt: Buffer.from(salt).toString("hex"),
  };
}

async function decrypt<T>(encItem: Encrypted, passKey: CryptoKey) {
  const { salt: saltHex, payload } = encItem;
  const salt = Buffer.from(saltHex, "hex");
  const derivedPassKey = await Passworder.deriveKey(passKey, salt);
  return Passworder.decrypt<T>(payload, derivedPassKey);
}
