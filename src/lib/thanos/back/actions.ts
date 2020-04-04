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

export function registerNewWallet(password: string, mnemonic?: string) {
  return withInited(async () => {
    await Vault.spawn(password, mnemonic);
    await unlock(password);
  });
}

export function lock() {
  return withInited(async () => {
    locked();
  });
}

export function unlock(password: string) {
  return withInited(async () => {
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    unlocked({ vault, accounts });
  });
}

export function createHDAccount(password: string) {
  return withUnlocked(async () => {
    const updatedAccounts = await Vault.createHDAccount(password);
    accountsUpdated(updatedAccounts);
  });
}

export function revealMnemonic(password: string) {
  return withUnlocked(() => Vault.revealMnemonic(password));
}

export function revealPrivateKey(accPublicKeyHash: string, password: string) {
  return withUnlocked(() => Vault.revealPrivateKey(accPublicKeyHash, password));
}

export function revealPublicKey(accPublicKeyHash: string) {
  return withUnlocked(({ vault }) => vault.revealPublicKey(accPublicKeyHash));
}

export function editAccount(accPublicKeyHash: string, name: string) {
  return withUnlocked(async ({ vault }) => {
    name = name.trim();
    if (!ACCOUNT_NAME_PATTERN.test(name)) {
      throw new Error(
        "Invalid name. It should be: 1-16 characters, without special"
      );
    }

    const updatedAccounts = await vault.editAccountName(accPublicKeyHash, name);
    accountsUpdated(updatedAccounts);
  });
}

export function importAccount(privateKey: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importAccount(privateKey);
    accountsUpdated(updatedAccounts);
  });
}

export function importFundraiserAccount(
  email: string,
  password: string,
  mnemonic: string
) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importFundraiserAccount(
      email,
      password,
      mnemonic
    );
    accountsUpdated(updatedAccounts);
  });
}

export function sign(
  accPublicKeyHash: string,
  bytes: string,
  watermark?: string
) {
  return withUnlocked(({ vault }) =>
    vault.sign(accPublicKeyHash, bytes, watermark)
  );
}

function withUnlocked<T>(factory: (state: UnlockedStoreState) => T) {
  const state = store.getState();
  assertUnlocked(state);
  return factory(state);
}

function withInited<T>(factory: (state: StoreState) => T) {
  const state = store.getState();
  assertInited(state);
  return factory(state);
}

function assertUnlocked(
  state: StoreState
): asserts state is UnlockedStoreState {
  assertInited(state);
  if (state.status !== ThanosStatus.Ready) {
    throw new Error("Not ready");
  }
}

function assertInited(state: StoreState) {
  if (!state.inited) {
    throw new Error("Not initialized");
  }
}
