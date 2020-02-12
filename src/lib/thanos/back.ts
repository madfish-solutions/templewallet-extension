import { createStore, createEvent, createEffect } from "effector";
import { browser } from "webextension-polyfill-ts";
import {
  ThanosFrontState,
  ThanosAccount,
  ThanosMessageType
} from "lib/thanos/types";

interface ThanosBackState {
  inited: boolean;
  storage: Storage | null;
  front: ThanosFrontState;
}

type Storage = {
  encrypted: string;
};

export async function getFrontState(): Promise<ThanosFrontState> {
  const { inited, front } = store.getState();
  if (inited) {
    return front;
  } else {
    await new Promise(r => setTimeout(r, 10));
    return getFrontState();
  }
}

export async function importAccount(privateKey: string) {
  const account = { privateKey };
  accountImported(account);
}

export function unlock(passphrase: string) {
  const state = store.getState();

  assertInited(state);
  if (!state.storage) {
    throw new Error("Nothing to unlock");
  }

  if (passphrase === "qwe123") {
    const unlockedState = JSON.parse(state.storage.encrypted);
    unlocked(unlockedState);
  } else {
    throw new Error("Incorrect password. Try 'qwe123'");
  }
}

function assertInited(state: ThanosBackState) {
  if (!state.inited) {
    throw new Error("Not initialized");
  }
}

const accountImported = createEvent<ThanosAccount>("Account imported");
const unlocked = createEvent<ThanosFrontState>("Unlocked");

const loadStorage = createEffect({
  handler: async () => {
    const items = await browser.storage.local.get();
    return Object.keys(items).length !== 0 ? (items as Storage) : null;
  }
});

const store = createStore<ThanosBackState>({
  inited: false,
  storage: null,
  front: {
    unlocked: true,
    account: null
  }
})
  .on(loadStorage.done, (state, { result: storage }) => ({
    ...state,
    inited: true,
    storage,
    front: {
      ...state.front,
      unlocked: !storage
    }
  }))
  .on(accountImported, (state, account) => ({
    ...state,
    front: {
      ...state.front,
      account
    }
  }))
  .on(unlocked, (state, { account }) => ({
    ...state,
    front: {
      ...state.front,
      unlocked: true,
      account
    }
  }));

(async () => {
  try {
    await loadStorage();
    store.watch(handleStateUpdate);
  } catch (err) {
    throw err;
  }
})();

function handleStateUpdate(state: ThanosBackState) {
  persistState(state);
  browser.runtime.sendMessage({ type: ThanosMessageType.STATE_UPDATED });
}

function persistState(state: ThanosBackState) {
  const encrypted = JSON.stringify(state);
  return browser.storage.local.set({ encrypted });
}
