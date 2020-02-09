import { createStore, createEvent, createEffect } from "effector";
import { Storage, browser } from "webextension-polyfill-ts";

export interface VaultState {
  inited: boolean;
  unlocked: boolean;
}

// export function

const loadStorage = createEffect({
  handler: async () => {
    const items = await browser.storage.local.get();
    return Object.keys(items).length !== 0 ? (items as Storage) : null;
  }
});

const vaultStore = createStore<VaultState>({
  inited: false,
  unlocked: false
});
