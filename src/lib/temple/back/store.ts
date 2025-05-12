import { createStore, createEvent } from 'effector';

import { TempleState, TempleStatus, StoredAccount, TempleSettings, FocusLocation } from 'lib/temple/types';
import { DEFAULT_PROMISES_QUEUE_COUNTERS, PromisesQueueCounters } from 'lib/utils';

import { Vault } from './vault';

interface StoreState extends TempleState {
  inited: boolean;
  vault: Vault | null;
}

interface UnlockedStoreState extends StoreState {
  vault: Vault;
}

export function toFront({ inited, vault, ...restProps }: StoreState): TempleState {
  return restProps;
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
}>('Unlocked');

export const accountsUpdated = createEvent<StoredAccount[]>('Accounts updated');

export const settingsUpdated = createEvent<TempleSettings>('Settings updated');

export const dAppQueueCountersUpdated = createEvent<PromisesQueueCounters>('DApp queue counters updated');

export const focusLocationChanged = createEvent<FocusLocation | null>('Focus location changed');

export const popupOpened = createEvent<number | null>('Popup opened');

export const popupClosed = createEvent<number | null>('Popup closed');

export const googleAuthTokenUpdated = createEvent<string | null>('Google auth token updated');

/**
 * Store
 */

export const store = createStore<StoreState>({
  inited: false,
  vault: null,
  status: TempleStatus.Idle,
  accounts: [],
  settings: null,
  dAppQueueCounters: DEFAULT_PROMISES_QUEUE_COUNTERS,
  focusLocation: null,
  windowsWithPopups: [],
  googleAuthToken: null
})
  .on(inited, (state, vaultExist) => ({
    ...state,
    inited: true,
    status: vaultExist ? TempleStatus.Locked : TempleStatus.Idle
  }))
  .on(locked, ({ focusLocation, windowsWithPopups }) => ({
    // Attention!
    // Security stuff!
    // Don't merge new state to existing!
    // Build a new state from scratch
    // Reset all properties!
    // Exceptions: focusLocation, windowsWithPopups
    inited: true,
    vault: null,
    status: TempleStatus.Locked,
    accounts: [],
    settings: null,
    dAppQueueCounters: DEFAULT_PROMISES_QUEUE_COUNTERS,
    focusLocation,
    windowsWithPopups,
    googleAuthToken: null
  }))
  .on(unlocked, (state, { vault, accounts, settings }) => ({
    ...state,
    vault,
    status: TempleStatus.Ready,
    accounts,
    settings
  }))
  .on(accountsUpdated, (state, accounts) => ({
    ...state,
    accounts
  }))
  .on(settingsUpdated, (state, settings) => ({
    ...state,
    settings
  }))
  .on(dAppQueueCountersUpdated, (state, dAppQueueCounters) => ({
    ...state,
    dAppQueueCounters
  }))
  .on(focusLocationChanged, (state, focusLocation) => ({
    ...state,
    focusLocation
  }))
  .on(popupOpened, (state, windowId) => ({
    ...state,
    windowsWithPopups: state.windowsWithPopups.filter(prevWindowId => prevWindowId !== windowId).concat(windowId)
  }))
  .on(popupClosed, (state, windowId) => ({
    ...state,
    windowsWithPopups: state.windowsWithPopups.filter(prevWindowId => prevWindowId !== windowId)
  }))
  .on(googleAuthTokenUpdated, (state, googleAuthToken) => ({
    ...state,
    googleAuthToken
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
