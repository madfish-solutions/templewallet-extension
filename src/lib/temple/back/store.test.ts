import browser from 'webextension-polyfill';

import { getAccountAddressForTezos } from 'temple/accounts';
import { TempleChainName } from 'temple/types';

import { TempleAccountType, TempleStatus } from '../types';

import {
  accountsUpdated,
  hdGroupsUpdated,
  inited as initEvent,
  locked,
  settingsUpdated,
  store,
  unlocked
} from './store';
import { Vault } from './vault';

describe('Store tests', () => {
  it('Browser storage works well', async () => {
    await browser.storage.local.set({ kek: 'KEK' });
    const items = await browser.storage.local.get('kek');
    expect(items.kek).toBe('KEK');
  });

  it('Initial store values', () => {
    const { inited, vault, status, accounts, networks, settings } = store.getState();
    expect(inited).toBeFalsy();
    expect(vault).toBeNull();
    expect(status).toBe(TempleStatus.Idle);
    expect(accounts).toEqual([]);
    expect(networks).toEqual([]);
    expect(settings).toBeNull();
  });
  it('Inited event', () => {
    initEvent(false);
    const { inited, status } = store.getState();
    expect(inited).toBeTruthy();
    expect(status).toBe(TempleStatus.Idle);
  });
  it('Inited event with Vault', () => {
    initEvent(true);
    const { status } = store.getState();
    expect(status).toBe(TempleStatus.Locked);
  });
  it('Locked event', () => {
    locked();
    const { status } = store.getState();
    expect(status).toBe(TempleStatus.Locked);
  });
  it('Unlocked event', () => {
    unlocked({ vault: {} as Vault, accounts: [], hdGroups: [], settings: {} });
    const { status } = store.getState();
    expect(status).toBe(TempleStatus.Ready);
  });
  it('Accounts updated event', () => {
    accountsUpdated([
      {
        id: 'testId',
        name: 'testName',
        type: TempleAccountType.Imported,
        chain: TempleChainName.Tezos,
        address: 'testHashKey'
      }
    ]);
    const { accounts } = store.getState();
    const { name, type } = accounts[0];
    expect(name).toBe('testName');
    expect(type).toBe(TempleAccountType.Imported);
    expect(getAccountAddressForTezos(accounts[0])).toBe('testHashKey');
  });
  it('HD groups updated event', () => {
    hdGroupsUpdated([{ id: 'testId', name: 'testName' }]);
    const { hdGroups } = store.getState();
    expect(hdGroups).toEqual([{ id: 'testId', name: 'testName' }]);
  });
  it('Settings updated event', () => {
    settingsUpdated({});
    const { settings } = store.getState();
    expect(settings).toEqual({});
  });
});
