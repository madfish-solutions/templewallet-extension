import { createStore, createEvent } from "effector";
import { ThanosState, ThanosStatus, ThanosAccount } from "lib/thanos/types";
import { NETWORKS } from "lib/thanos/networks";
import { Vault } from "lib/thanos/back/vault";

export interface StoreState extends ThanosState {
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
}: StoreState): ThanosState {
  return {
    status,
    accounts,
    networks,
  };
}

/**
 * Events
 */

export const inited = createEvent<boolean>("Inited");

export const locked = createEvent("Locked");

export const unlocked = createEvent<{
  vault: Vault;
  accounts: ThanosAccount[];
}>("Unlocked");

export const accountsUpdated = createEvent<ThanosAccount[]>("Accounts updated");

/**
 * Store
 */

export const store = createStore<StoreState>({
  inited: false,
  vault: null,
  status: ThanosStatus.Idle,
  accounts: [],
  networks: [],
})
  .on(inited, (state, vaultExist) => ({
    ...state,
    inited: true,
    status: vaultExist ? ThanosStatus.Locked : ThanosStatus.Idle,
    networks: NETWORKS,
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
    accounts: [],
    networks: NETWORKS,
  }))
  .on(unlocked, (state, { vault, accounts }) => ({
    ...state,
    vault,
    status: ThanosStatus.Ready,
    accounts,
  }))
  .on(accountsUpdated, (state, accounts) => ({
    ...state,
    accounts,
  }));
