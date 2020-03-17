import { ThanosState, ThanosStatus } from "lib/thanos/types";
import { Vault } from "lib/thanos/back/vault";
import {
  StoreState,
  UnlockedStoreState,
  toFront,
  store,
  locked,
  unlocked,
  accountsUpdated
} from "lib/thanos/back/store";

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9 _-]{1,16}$/;

export async function getFrontState(): Promise<ThanosState> {
  const state = store.getState();
  if (state.inited) {
    return toFront(state);
  } else {
    await new Promise(r => setTimeout(r, 10));
    return getFrontState();
  }
}

export async function registerNewWallet(password: string, mnemonic?: string) {
  const state = store.getState();
  assertInited(state);

  try {
    await Vault.spawn(password, mnemonic);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    throw new Error("Failed to create New Wallet");
  }

  await unlock(password);
}

export async function lock() {
  const state = store.getState();
  assertInited(state);

  locked();
}

export async function unlock(password: string) {
  const state = store.getState();
  assertInited(state);

  try {
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();

    unlocked({ vault, accounts });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    throw new Error("Incorrect password");
  }
}

export async function createHDAccount() {
  const state = store.getState();
  assertUnlocked(state);

  let updatedAccounts;
  try {
    updatedAccounts = await state.vault.createHDAccount();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    throw new Error("Failed to create HD Account");
  }
  accountsUpdated(updatedAccounts);
}

export async function revealPrivateKey(accIndex: number, password: string) {
  const state = store.getState();
  assertUnlocked(state);

  try {
    return await state.vault.revealPrivateKey(accIndex, password);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    throw new Error("Invalid password");
  }
}

export async function revealMnemonic(password: string) {
  const state = store.getState();
  assertUnlocked(state);

  try {
    return await state.vault.revealMnemonic(password);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    throw new Error("Invalid password");
  }
}

export async function editAccount(accIndex: number, name: string) {
  const state = store.getState();
  assertUnlocked(state);

  name = name.trim();
  if (!ACCOUNT_NAME_PATTERN.test(name)) {
    throw new Error(
      "Invalid name. It should be: 1-16 characters, without special"
    );
  }

  let updatedAccounts;
  try {
    updatedAccounts = await state.vault.editAccountName(accIndex, name);
  } catch (_err) {
    throw new Error("Failed to edit account name");
  }
  accountsUpdated(updatedAccounts);
}

export async function importAccount(privateKey: string) {
  const state = store.getState();
  assertUnlocked(state);

  try {
    const updatedAccounts = await state.vault.importAccount(privateKey);
    accountsUpdated(updatedAccounts);
  } catch (_err) {
    throw new Error("Failed to import account");
  }
}

export async function importFundraiserAccount(
  email: string,
  password: string,
  mnemonic: string
) {
  const state = store.getState();
  assertUnlocked(state);

  try {
    const updatedAccounts = await state.vault.importFundraiserAccount(
      email,
      password,
      mnemonic
    );
    accountsUpdated(updatedAccounts);
  } catch (_err) {
    throw new Error("Failed to import fundraiser account");
  }
}

export async function sign(
  accIndex: number,
  bytes: string,
  watermark?: Uint8Array
) {
  const state = store.getState();
  assertUnlocked(state);

  try {
    return await state.vault.sign(accIndex, bytes, watermark);
  } catch (_err) {
    throw new Error("Failed to sign");
  }
}

function assertInited(state: StoreState) {
  if (!state.inited) {
    throw new Error("Not initialized");
  }
}

function assertUnlocked(
  state: StoreState
): asserts state is UnlockedStoreState {
  assertInited(state);
  if (state.status !== ThanosStatus.Ready) {
    throw new Error("Not ready");
  }
}
