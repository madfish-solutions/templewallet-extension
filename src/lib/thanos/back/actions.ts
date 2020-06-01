import {
  ThanosDAppRequest,
  ThanosDAppMessageType,
  ThanosDAppResponse,
} from "@thanos-wallet/dapp/dist/types";
import { IntercomServer } from "lib/intercom/server";
import {
  ThanosState,
  ThanosStatus,
  ThanosMessageType,
  ThanosRequest,
} from "lib/thanos/types";
import { Vault } from "lib/thanos/back/vault";
import {
  StoreState,
  UnlockedStoreState,
  toFront,
  store,
  locked,
  unlocked,
  accountsUpdated,
} from "lib/thanos/back/store";
import { requestPermission, requestOperation } from "lib/thanos/back/dapp";

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9 _-]{1,16}$/;
const AUTODECLINE_AFTER = 60_000;

export async function getFrontState(): Promise<ThanosState> {
  const state = store.getState();
  if (state.inited) {
    return toFront(state);
  } else {
    await new Promise((r) => setTimeout(r, 10));
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

export function createHDAccount(name?: string) {
  return withUnlocked(async ({ vault }) => {
    if (name) {
      name = name.trim();
      if (!ACCOUNT_NAME_PATTERN.test(name)) {
        throw new Error(
          "Invalid name. It should be: 1-16 characters, without special"
        );
      }
    }

    const updatedAccounts = await vault.createHDAccount(name);
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

export function removeAccount(accPublicKeyHash: string, password: string) {
  return withUnlocked(async () => {
    const updatedAccounts = await Vault.removeAccount(
      accPublicKeyHash,
      password
    );
    accountsUpdated(updatedAccounts);
  });
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

export function importAccount(privateKey: string, encPassword?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importAccount(privateKey, encPassword);
    accountsUpdated(updatedAccounts);
  });
}

export function importMnemonicAccount(
  mnemonic: string,
  password?: string,
  derivationPath?: string
) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importMnemonicAccount(
      mnemonic,
      password,
      derivationPath
    );
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
  id: string,
  bytes: string,
  watermark?: string
) {
  return withUnlocked(
    () =>
      new Promise(async (resolve, reject) => {
        intercom.broadcast({
          type: ThanosMessageType.ConfirmRequested,
          id,
        });

        let stop: any;
        let timeout: any;

        let closing = false;
        const close = () => {
          if (closing) return;
          closing = true;

          try {
            if (stop) stop();
            if (timeout) clearTimeout(timeout);

            intercom.broadcast({
              type: ThanosMessageType.ConfirmExpired,
              id,
            });
          } catch (_err) {}
        };

        const decline = () => {
          reject(new Error("Declined"));
        };

        stop = intercom.onRequest(async (req: ThanosRequest) => {
          if (
            req?.type === ThanosMessageType.ConfirmRequest &&
            req?.id === id
          ) {
            if (req.confirm) {
              const result = await Vault.sign(
                accPublicKeyHash,
                req.password!,
                bytes,
                watermark
              );
              resolve(result);
            } else {
              decline();
            }

            close();

            return {
              type: ThanosMessageType.ConfirmResponse,
              id,
            };
          }
        });

        // Decline after timeout
        timeout = setTimeout(() => {
          decline();
          close();
        }, AUTODECLINE_AFTER);
      })
  );
}

export async function processDApp(
  intercom: IntercomServer,
  origin: string,
  req: ThanosDAppRequest
): Promise<ThanosDAppResponse | void> {
  switch (req?.type) {
    case ThanosDAppMessageType.PermissionRequest:
      return withInited(() => requestPermission(origin, req, intercom));

    case ThanosDAppMessageType.OperationRequest:
      return withInited(() => requestOperation(origin, req, intercom));
  }
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
