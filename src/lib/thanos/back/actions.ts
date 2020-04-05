import { Buffer } from "buffer";
import { IntercomServer } from "lib/intercom/server";
import { generateSalt } from "lib/thanos/passworder";
import {
  ThanosState,
  ThanosStatus,
  ThanosMessageType,
  ThanosConfirmRequest
} from "lib/thanos/types";
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
import { browser } from "webextension-polyfill-ts";

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
  intercom: IntercomServer,
  accPublicKeyHash: string,
  bytes: string,
  watermark?: string
) {
  return withUnlocked(
    () =>
      new Promise(async (resolve, reject) => {
        const id = Buffer.from(generateSalt()).toString("hex");
        const search = new URLSearchParams({ id });
        const confirmWin = await browser.windows.create({
          url: browser.runtime.getURL(`confirm.html?${search}`),
          type: "popup",
          height: 680,
          width: 420
        });

        const stop = intercom.onRequest(async msg => {
          if (
            msg?.type === ThanosMessageType.ConfirmRequest &&
            msg?.id === id
          ) {
            const req = msg as ThanosConfirmRequest;

            if (req.confirm) {
              const result = await Vault.sign(
                accPublicKeyHash,
                req.password!,
                bytes,
                watermark
              );
              resolve(result);
            } else {
              reject(new Error("Declined"));
            }

            stop();
            browser.windows.remove(confirmWin.id!);
          }
        });
      })
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
