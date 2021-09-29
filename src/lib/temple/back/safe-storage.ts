import { Buffer } from "buffer";
import { browser } from "webextension-polyfill-ts";

import * as Passworder from "lib/temple/passworder";

interface EncryptedStorage {
  encrypted: Passworder.EncryptedPayload;
  salt: string;
}

export async function isStored(storageKey: string) {
  const items = await browser.storage.local.get([storageKey]);
  return items[storageKey] !== undefined;
}

export async function fetchAndDecryptOne<T>(
  storageKey: string,
  passKey: CryptoKey
) {
  const encStorage = await fetchEncryptedOne(storageKey);
  return decrypt<T>(encStorage, passKey);
}

export async function encryptAndSaveMany(
  items: [string, any][],
  passKey: CryptoKey
) {
  const encItems = await Promise.all(
    items.map(async ([storageKey, stuff]) => {
      const encStorage = await encrypt(stuff, passKey);
      return [storageKey, encStorage] as [typeof storageKey, typeof encStorage];
    })
  );

  await saveEncrypted(encItems);
}

export async function removeMany(keys: string[]) {
  await browser.storage.local.remove(keys);
}

async function encrypt(stuff: any, passKey: CryptoKey) {
  const salt = Passworder.generateSalt();
  const derivedPassKey = await Passworder.deriveKey(passKey, salt);
  const encrypted = await Passworder.encrypt(stuff, derivedPassKey);

  return {
    encrypted,
    salt: Buffer.from(salt).toString("hex"),
  };
}

async function decrypt<T>(encStorage: EncryptedStorage, passKey: CryptoKey) {
  const { salt: saltHex, encrypted } = encStorage;
  const salt = Buffer.from(saltHex, "hex");
  const derivedPassKey = await Passworder.deriveKey(passKey, salt);
  return Passworder.decrypt<T>(encrypted, derivedPassKey);
}

async function fetchEncryptedOne(key: string) {
  const items = await browser.storage.local.get([key]);
  if (items[key] !== undefined) {
    return items[key] as EncryptedStorage;
  } else {
    throw new Error("Some storage item not found");
  }
}

async function saveEncrypted(
  items: { [k: string]: EncryptedStorage } | [string, EncryptedStorage][]
) {
  if (Array.isArray(items)) {
    items = iterToObj(items);
  }
  await browser.storage.local.set(items);
}

function iterToObj(iter: [string, any][]) {
  const obj: { [k: string]: any } = {};
  for (const [k, v] of iter) {
    obj[k] = v;
  }
  return obj;
}
