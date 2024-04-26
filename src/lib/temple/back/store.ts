import { createStore, createEvent } from 'effector';

import { TempleState, TempleStatus, StoredAccount, TempleSettings } from 'lib/temple/types';

import { Vault } from './vault';

interface StoreState extends TempleState {
  inited: boolean;
  vault: Vault | null;
}

interface UnlockedStoreState extends StoreState {
  vault: Vault;
}

export function toFront({ status, accounts, settings, hdWalletsNames }: StoreState): TempleState {
  return {
    status,
    accounts,
    settings,
    hdWalletsNames
  };
}

/**
 * Events
 */

export const inited = createEvent<boolean>('Inited');

export const locked = createEvent('Locked');

export const unlocked = createEvent<{
  vault: Vault;
  accounts: StoredAccount[];
  settings: TempleSettings;
  hdWalletsNames: StringRecord;
}>('Unlocked');

export const accountsUpdated = createEvent<StoredAccount[]>('Accounts updated');

export const hdWalletsNamesUpdated = createEvent<StringRecord>('HD wallets names updated');

export const settingsUpdated = createEvent<TempleSettings>('Settings updated');

/**
 * Store
 */

export const store = createStore<StoreState>({
  inited: false,
  vault: null,
  status: TempleStatus.Idle,
  accounts: [],
  hdWalletsNames: {},
  settings: null
})
  .on(inited, (state, vaultExist) => ({
    ...state,
    inited: true,
    status: vaultExist ? TempleStatus.Locked : TempleStatus.Idle
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
    hdWalletsNames: {},
    settings: null
  }))
  .on(unlocked, (state, { vault, accounts, settings, hdWalletsNames }) => ({
    ...state,
    vault,
    status: TempleStatus.Ready,
    accounts,
    settings,
    hdWalletsNames
  }))
  .on(accountsUpdated, (state, accounts) => ({
    ...state,
    accounts
  }))
  .on(hdWalletsNamesUpdated, (state, hdWalletsNames) => ({
    ...state,
    hdWalletsNames
  }))
  .on(settingsUpdated, (state, settings) => ({
    ...state,
    settings
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

function assertUnlocked(state: StoreState): asserts state is UnlockedStoreState {
  assertInited(state);
  if (state.status !== TempleStatus.Ready) {
    throw new Error('Not ready');
  }
}

function assertInited(state: StoreState) {
  if (!state.inited) {
    throw new Error('Not initialized');
  }
}
