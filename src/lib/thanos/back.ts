import { createStore, createEvent } from "effector";
import { browser } from "webextension-polyfill-ts";
import {
  ThanosState,
  ThanosStatus,
  ThanosAccount,
  ThanosMessageType,
  ThanosRequest,
  ThanosResponse
} from "lib/thanos/types";
import { Vault } from "lib/thanos/back/vault";

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9 _-]{1,16}$/;

interface ThanosBackState extends ThanosState {
  inited: boolean;
  vault: Vault | null;
}

interface UnlockedThanosBackState extends ThanosBackState {
  vault: Vault;
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
      await registerNewWallet(msg.password, msg.mnemonic);
      return { type: ThanosMessageType.NewWalletResponse };

    case ThanosMessageType.UnlockRequest:
      await unlock(msg.password);
      return { type: ThanosMessageType.UnlockResponse };

    case ThanosMessageType.LockRequest:
      await lock();
      return { type: ThanosMessageType.LockResponse };

    case ThanosMessageType.CreateAccountRequest:
      await createHDAccount();
      return { type: ThanosMessageType.CreateAccountResponse };

    case ThanosMessageType.RevealPrivateKeyRequest:
      const privateKey = await revealPrivateKey(msg.accountIndex, msg.password);
      return {
        type: ThanosMessageType.RevealPrivateKeyResponse,
        privateKey
      };

    case ThanosMessageType.RevealMnemonicRequest:
      const mnemonic = await revealMnemonic(msg.password);
      return {
        type: ThanosMessageType.RevealMnemonicResponse,
        mnemonic
      };

    case ThanosMessageType.EditAccountRequest:
      await editAccount(msg.accountIndex, msg.name);
      return {
        type: ThanosMessageType.EditAccountResponse
      };

    case ThanosMessageType.ImportAccountRequest:
      await importAccount(msg.privateKey);
      return {
        type: ThanosMessageType.ImportAccountResponse
      };

    case ThanosMessageType.ImportFundraiserAccountRequest:
      await importFundraiserAccount(msg.email, msg.password, msg.mnemonic);
      return {
        type: ThanosMessageType.ImportFundraiserAccountResponse
      };

    case ThanosMessageType.SignRequest:
      const result = await sign(msg.accountIndex, msg.bytes, msg.watermark);
      return {
        type: ThanosMessageType.SignResponse,
        result
      };
  }
}

export async function getFrontState(): Promise<ThanosState> {
  const state = store.getState();
  if (state.inited) {
    return frontStore.getState();
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

function assertInited(state: ThanosBackState) {
  if (!state.inited) {
    throw new Error("Not initialized");
  }
}

function assertUnlocked(
  state: ThanosBackState
): asserts state is UnlockedThanosBackState {
  assertInited(state);
  if (state.status !== ThanosStatus.Ready) {
    throw new Error("Not ready");
  }
}

/**
 * Private
 */

const inited = createEvent<boolean>("Inited");
const locked = createEvent("Locked");
const unlocked = createEvent<{
  vault: Vault;
  accounts: ThanosAccount[];
}>("Unlocked");
const accountsUpdated = createEvent<ThanosAccount[]>("Accounts updated");

const store = createStore<ThanosBackState>({
  inited: false,
  vault: null,
  status: ThanosStatus.Idle,
  accounts: []
})
  .on(inited, (state, vaultExist) => ({
    ...state,
    inited: true,
    status: vaultExist ? ThanosStatus.Locked : ThanosStatus.Idle
  }))
  .on(locked, () => ({
    // Attension!
    // Security stuff!
    // Don't merge new state to exisitng!
    // Build a new state from scratch
    // Reset all properties!
    inited: true,
    vault: null,
    status: ThanosStatus.Locked,
    accounts: []
  }))
  .on(unlocked, (state, { vault, accounts }) => ({
    ...state,
    vault,
    status: ThanosStatus.Ready,
    accounts
  }))
  .on(accountsUpdated, (state, accounts) => ({
    ...state,
    accounts
  }));

const frontStore = store.map<ThanosState>(({ status, accounts }) => ({
  status,
  accounts
}));

(async () => {
  try {
    const vaultExist = await Vault.isExist();
    inited(vaultExist);

    frontStore.watch(() => {
      browser.runtime.sendMessage({ type: ThanosMessageType.StateUpdated });
    });
  } catch (err) {
    throw err;
  }
})();
