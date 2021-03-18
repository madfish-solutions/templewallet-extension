import { createStore, createEvent } from "effector";

import { Vault } from "lib/temple/back/vault";
import { NETWORKS } from "lib/temple/networks";
import {
  TempleState,
  TempleStatus,
  TempleAccount,
  TempleSettings,
} from "lib/temple/types";

export interface StoreState extends TempleState {
  inited: boolean;
  vault: Vault | null;
}

export interface UnlockedStoreState extends StoreState {
  vault: Vault;
}

export function toFront({
  status,
  accounts,
  networks,
  settings,
}: StoreState): TempleState {
  return {
    status,
    accounts,
    networks,
    settings,
  };
}

/**
 * Events
 */

export const inited = createEvent<boolean>("Inited");

export const locked = createEvent("Locked");

export const unlocked = createEvent<{
  vault: Vault;
  accounts: TempleAccount[];
  settings: TempleSettings;
}>("Unlocked");

export const accountsUpdated = createEvent<TempleAccount[]>("Accounts updated");

export const settingsUpdated = createEvent<TempleSettings>("Settings updated");

/**
 * Store
 */

export const store = createStore<StoreState>({
  inited: false,
  vault: null,
  status: TempleStatus.Idle,
  accounts: [],
  networks: [],
  settings: null,
})
  .on(inited, (state, vaultExist) => ({
    ...state,
    inited: true,
    status: vaultExist ? TempleStatus.Locked : TempleStatus.Idle,
    networks: NETWORKS,
  }))
  .on(locked, () => ({
    // Attention!
    // Security stuff!
    // Don't merge new state to exisitng!
    // Build a new state from scratch
    // Reset all properties!
    inited: true,
    vault: null,
    status: TempleStatus.Locked,
    accounts: [],
    networks: NETWORKS,
    settings: null,
  }))
  .on(unlocked, (state, { vault, accounts, settings }) => ({
    ...state,
    vault,
    status: TempleStatus.Ready,
    accounts,
    settings,
  }))
  .on(accountsUpdated, (state, accounts) => ({
    ...state,
    accounts,
  }))
  .on(settingsUpdated, (state, settings) => ({
    ...state,
    settings,
  }));

/**
 * Helpers
 */

export function withUnlocked<T>(factory: (state: UnlockedStoreState) => T) {
  const state = store.getState();
  assertUnlocked(state);
  return factory(state);
}

export function withInited<T>(factory: (state: StoreState) => T) {
  const state = store.getState();
  assertInited(state);
  return factory(state);
}

export function assertUnlocked(
  state: StoreState
): asserts state is UnlockedStoreState {
  assertInited(state);
  if (state.status !== TempleStatus.Ready) {
    throw new Error("Not ready");
  }
}

export function assertInited(state: StoreState) {
  if (!state.inited) {
    throw new Error("Not initialized");
  }
}
