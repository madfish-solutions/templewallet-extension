import { createStore, createEvent, createEffect } from "effector";
import { Storage, browser } from "webextension-polyfill-ts";
import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
// import { Keychain } from "./keychain";

export interface VaultState {
  inited: boolean;
  unlocked: boolean;
}

export function init() {
  return () => {};
}

const vaultStore = createStore<VaultState>({
  inited: false,
  unlocked: false
});

// class Kek implements Keychain {
//   serialize() {
//     return Promise.resolve("123");
//   }
// }

// const kek = new Kek();
// kek.serialize();
