import { createStore, createEvent } from "effector";
import { browser } from "webextension-polyfill-ts";
import { Buffer } from "buffer";
import * as Bip39 from "bip39";
// import * as Bip32 from "bip32";
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

// const TEZOS_BIP44_COINTYPE = 1729;
const STORAGE_KEY = "back";

interface ThanosBackState {
  inited: boolean;
  front: ThanosFrontState;
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
  const seed = Bip39.mnemonicToSeedSync(mnemonic, password);
  const privateKey = TaquitoUtils.b58cencode(
    seed.slice(0, 32),
    TaquitoUtils.prefix.edsk2
  );
  const stuff = { mnemonic, privateKey };

  const salt = Passworder.generateSalt();
  const passKey = await Passworder.generateKey(password, salt);
  const encrypted = await Passworder.encrypt(stuff, passKey);

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
    const { privateKey } = await Passworder.decrypt(storage.encrypted, passKey);
    const signer = new InMemorySigner(privateKey as string);
    const publicKeyHash = await signer.publicKeyHash();

    const account = { publicKeyHash };
    unlocked(account);
  } catch (_err) {
    throw new Error("Incorrect password");
  }
}

// key.substr(0, encrypted ? 5 : 4);
function assertInited(state: ThanosBackState) {
  if (!state.inited) {
    throw new Error("Not initialized");
  }
}

/**
 * Private
 */

const inited = createEvent<boolean>("Inited");
const unlocked = createEvent<ThanosAccount>("Unlocked");

const store = createStore<ThanosBackState>({
  inited: false,
  front: {
    status: ThanosStatus.Idle,
    account: null
  }
})
  .on(inited, (state, storageExist) => ({
    ...state,
    inited: true,
    front: {
      ...state.front,
      status: storageExist ? ThanosStatus.Locked : ThanosStatus.Idle
    }
  }))
  .on(unlocked, (state, account) => ({
    ...state,
    front: {
      ...state.front,
      status: ThanosStatus.Ready,
      account
    }
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

// function persistState(state: ThanosBackState) {
//   const frontEncrypted = JSON.stringify(state.front);
//   return browser.storage.local.set({ frontEncrypted });
// }

// const privateKey = seedToPrivateKey(
//   seed,
//   `m/44'/${TEZOS_BIP44_COINTYPE}'/${account}'/0/0`
// );

// function seedToPrivateKey(seed: Buffer, derivePath: string) {
//   const keyNode = Bip32.fromSeed(seed);
//   const keyChild = keyNode.derivePath(derivePath);
//   return keyChild.privateKey!.toString("hex");
// }

// const MNEMONIC = Symbol("ThanosVault.Mnemonic");
// const KEY = Symbol("ThanosVault.Key");

// class ThanosVault {
//   [MNEMONIC]: string;
//   [KEY]: string;

//   constructor(mnemonic: string, password: string) {
//     this[MNEMONIC] = mnemonic;
//     this[KEY] = password;
//   }
// }

/**
 * 1) Generate account from mnemonic;
 * 2)
 */
