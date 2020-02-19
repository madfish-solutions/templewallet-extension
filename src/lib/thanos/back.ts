import { createStore, createEvent } from "effector";
import { browser } from "webextension-polyfill-ts";
import { Buffer } from "buffer";
import * as Bip39 from "bip39";
import * as Bip32 from "bip32";
import * as TaquitoUtils from "@taquito/utils";
import { InMemorySigner } from "@taquito/signer";
import * as Passworder from "lib/passworder";
import {
  ThanosFrontState,
  ThanosStatus,
  ThanosAccount,
  ThanosMessageType,
  ThanosRequest,
  ThanosResponse
} from "lib/thanos/types";

const TEZOS_BIP44_COINTYPE = 1729;
const STORAGE_KEY = "back";

interface ThanosBackState {
  inited: boolean;
  front: ThanosFrontState;
  passKey: CryptoKey | null;
}

interface UnlockedThanosBackState extends ThanosBackState {
  passKey: CryptoKey;
}

interface EncryptedStuff {
  mnemonic: string;
  accounts: EncryptedAccount[];
}

interface EncryptedAccount {
  name: string;
  privateKey: string;
}

interface Storage {
  salt: string;
  encrypted: Passworder.EncryptedPayload;
}

export async function processRequest(
  msg: ThanosRequest
): Promise<ThanosResponse | void> {
  switch (msg.type) {
    case ThanosMessageType.GetStateRequest:
      const state = await getFrontState();
      return {
        type: ThanosMessageType.GetStateResponse,
        state
      };

    case ThanosMessageType.NewWalletRequest:
      await registerNewWallet(msg.mnemonic, msg.password);
      return { type: ThanosMessageType.NewWalletResponse };

    case ThanosMessageType.UnlockRequest:
      await unlock(msg.password);
      return { type: ThanosMessageType.UnlockResponse };

    case ThanosMessageType.LockRequest:
      await lock();
      return { type: ThanosMessageType.LockResponse };
  }
}

export async function getFrontState(): Promise<ThanosFrontState> {
  const { inited, front } = store.getState();
  if (inited) {
    return front;
  } else {
    await new Promise(r => setTimeout(r, 10));
    return getFrontState();
  }
}

export async function registerNewWallet(mnemonic: string, password: string) {
  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const privateKey = seedToPrivateKey(seed, 0);

  const initialAccount = {
    name: "Account 1",
    privateKey
  };
  const stuff = { mnemonic, accounts: [initialAccount] };

  const salt = Passworder.generateSalt();
  const passKey = await Passworder.generateKey(password, salt);
  const encrypted = await encrypt(stuff, passKey);

  await saveStorage({
    salt: Buffer.from(salt).toString("hex"),
    encrypted
  });

  await unlock(password);
}

export async function unlock(password: string) {
  const state = store.getState();
  assertInited(state);

  const storage = await fetchStorage();
  if (!storage) {
    throw new Error("Nothing to unlock");
  }

  try {
    const salt = Buffer.from(storage.salt, "hex");
    const passKey = await Passworder.generateKey(password, salt);
    const { accounts } = await decrypt(storage.encrypted, passKey);
    const frontAccount = await Promise.all(accounts.map(toFrontAccount));

    unlocked({ accounts: frontAccount, passKey });
  } catch (_err) {
    throw new Error("Incorrect password");
  }
}

export async function createAccounts(howMany = 1) {
  const state = store.getState();
  assertUnlocked(state);

  const storage = await fetchStorage();
  if (!storage) {
    throw new Error("Storage Not Found");
  }

  const { mnemonic, accounts: exisitngAccounts } = await decrypt(
    storage.encrypted,
    state.passKey
  );
  const seed = Bip39.mnemonicToSeedSync(mnemonic);

  const existingLength = exisitngAccounts.length;
  const newAccounts = Array.from({ length: howMany }).map((_, i) => {
    const newIndex = existingLength + i;
    return {
      name: `Account ${newIndex}`,
      privateKey: seedToPrivateKey(seed, newIndex)
    };
  });

  const accounts = [...exisitngAccounts, ...newAccounts];

  const encrypted = await encrypt({ mnemonic, accounts }, state.passKey);
  await saveStorage({ ...storage, encrypted });

  const frontAccounts = await Promise.all(accounts.map(toFrontAccount));
  accountsUpdated(frontAccounts);
}

export async function lock() {
  const state = store.getState();
  assertInited(state);

  locked();
}

function encrypt(stuff: EncryptedStuff, passKey: CryptoKey) {
  return Passworder.encrypt(stuff, passKey);
}

function decrypt(
  encryptedPayload: Passworder.EncryptedPayload,
  passKey: CryptoKey
): Promise<EncryptedStuff> {
  return Passworder.decrypt(encryptedPayload, passKey);
}

function assertInited(state: ThanosBackState) {
  if (!state.inited) {
    throw new Error("Not initialized");
  }
}

function assertUnlocked(
  state: ThanosBackState
): asserts state is UnlockedThanosBackState {
  assertInited(state);
  if (state.front.status !== ThanosStatus.Ready) {
    throw new Error("Not ready");
  }
}

/**
 * Private
 */

const inited = createEvent<boolean>("Inited");
const locked = createEvent("Locked");
const unlocked = createEvent<{
  accounts: ThanosAccount[];
  passKey: CryptoKey;
}>("Unlocked");
const accountsUpdated = createEvent<ThanosAccount[]>("Accounts updated");

const store = createStore<ThanosBackState>({
  inited: false,
  front: {
    status: ThanosStatus.Idle,
    accounts: []
  },
  passKey: null
})
  .on(inited, (state, storageExist) => ({
    ...state,
    inited: true,
    front: {
      ...state.front,
      status: storageExist ? ThanosStatus.Locked : ThanosStatus.Idle
    }
  }))
  .on(locked, () => ({
    // Attension!
    // Security stuff!
    // Don't merge new state to exisitng!
    // Build a new state from scratch
    // Reset all security properties!
    inited: true,
    front: {
      status: ThanosStatus.Locked,
      accounts: []
    },
    passKey: null
  }))
  .on(unlocked, (state, { accounts, passKey }) => ({
    ...state,
    front: {
      ...state.front,
      status: ThanosStatus.Ready,
      accounts
    },
    passKey
  }));

(async () => {
  try {
    const storage = await fetchStorage();
    const storageExist = Boolean(storage);
    inited(storageExist);

    store.watch(handleStateUpdate);
  } catch (err) {
    throw err;
  }
})();

function handleStateUpdate(_state: ThanosBackState) {
  // persistState(state);
  browser.runtime.sendMessage({ type: ThanosMessageType.StateUpdated });
}

async function fetchStorage() {
  const items = await browser.storage.local.get();
  if (STORAGE_KEY in items) {
    return items[STORAGE_KEY] as Storage;
  } else {
    return null;
  }
}

async function saveStorage(storage: Storage) {
  await browser.storage.local.set({ [STORAGE_KEY]: storage });
}

function seedToPrivateKey(seed: Buffer, account: number) {
  const keyNode = Bip32.fromSeed(seed);
  const keyChild = keyNode.derivePath(
    `m/44'/${TEZOS_BIP44_COINTYPE}'/${account}'/0/0`
  );

  return TaquitoUtils.b58cencode(
    keyChild.privateKey!.slice(0, 32),
    TaquitoUtils.prefix.edsk2
  );
}

async function toFrontAccount({ name, privateKey }: EncryptedAccount) {
  const signer = new InMemorySigner(privateKey);
  const publicKeyHash = await signer.publicKeyHash();
  return { name, publicKeyHash };
}
