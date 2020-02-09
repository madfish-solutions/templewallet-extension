import { createStore, createEvent, createEffect } from "effector";
import { browser } from "webextension-polyfill-ts";
import {
  ThanosState,
  ThanosAccount,
  ThanosMessageType
} from "lib/thanos/types";

interface ThanosBackState extends ThanosState {
  inited: boolean;
  storage: Storage | null;
}

type Storage = {
  encrypted: string;
};

export async function getFrontState(): Promise<ThanosState> {
  const { inited, unlocked, account } = store.getState();
  if (inited) {
    return { unlocked, account };
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
    throw new Error("Not inited");
  }
}

const accountImported = createEvent<ThanosAccount>("Account imported");
const unlocked = createEvent<ThanosState>("Unlocked");

const loadStorage = createEffect({
  handler: async () => {
    const items = await browser.storage.local.get();
    return Object.keys(items).length !== 0 ? (items as Storage) : null;
  }
});

const store = createStore<ThanosBackState>({
  inited: false,
  unlocked: true,
  account: null,
  storage: null
})
  .on(loadStorage.done, (state, { result: storage }) => ({
    ...state,
    inited: true,
    unlocked: !storage,
    storage
  }))
  .on(accountImported, (state, account) => ({
    ...state,
    account
  }))
  .on(unlocked, (state, { account }) => ({
    ...state,
    unlocked: true,
    account
  }));

(async () => {
  try {
    await loadStorage();
    store.watch(handleStateUpdate);
  } catch (err) {
    throw err;
  }
})();

function handleStateUpdate(state: ThanosState) {
  persistState(state);
  browser.runtime.sendMessage({ type: ThanosMessageType.STATE_UPDATED });
}

function persistState(state: ThanosState) {
  const encrypted = JSON.stringify(state);
  return browser.storage.local.set({ encrypted });
}

// function setStorage(items: Storage.StorageAreaSetItemsType) {
//   return browser.storage.local.set(items);
// }

// browser.runtime.onMessage.addListener(async (msg, sender) => {
//   browser.windows.create({
//     url: browser.runtime.getURL("action.html"),
//     type: "popup",
//     height: 680,
//     width: 420
//   });

//   return "PONG";
// });
