import { browser } from "webextension-polyfill-ts";

import { TempleAccountType, TempleStatus } from "../types";
import {
  accountsUpdated,
  inited as initEvent,
  locked,
  settingsUpdated,
  store,
  unlocked,
} from "./store";
import { Vault } from "./vault";

describe("Store tests", () => {
  it("Browser storage works well", async () => {
    await browser.storage.local.set({ kek: "KEK" });
    const items = await browser.storage.local.get("kek");
    expect(items.kek).toBe("KEK");
  });

  it("Initial store values", () => {
    const { inited, vault, status, accounts, networks, settings } =
      store.getState();
    expect(inited).toBeFalsy();
    expect(vault).toBeNull();
    expect(status).toBe(TempleStatus.Idle);
    expect(accounts).toEqual([]);
    expect(networks).toEqual([]);
    expect(settings).toBeNull();
  });
  it("Inited event", () => {
    initEvent(false);
    const { inited, status } = store.getState();
    expect(inited).toBeTruthy();
    expect(status).toBe(TempleStatus.Idle);
  });
  it("Inited event with Vault", () => {
    initEvent(true);
    const { status } = store.getState();
    expect(status).toBe(TempleStatus.Locked);
  });
  it("Locked event", () => {
    locked();
    const { status } = store.getState();
    expect(status).toBe(TempleStatus.Locked);
  });
  it("Unlocked event", () => {
    unlocked({ vault: {} as Vault, accounts: [], settings: {} });
    const { status } = store.getState();
    expect(status).toBe(TempleStatus.Ready);
  });
  it("Accounts updated event", () => {
    accountsUpdated([
      {
        name: "testName",
        type: TempleAccountType.Imported,
        publicKeyHash: "testHashKey",
      },
    ]);
    const { accounts } = store.getState();
    const { name, type, publicKeyHash } = accounts[0];
    expect(name).toBe("testName");
    expect(type).toBe(TempleAccountType.Imported);
    expect(publicKeyHash).toBe("testHashKey");
  });
  it("Settings updated event", () => {
    settingsUpdated({});
    const { settings } = store.getState();
    expect(settings).toEqual({});
  });
});
