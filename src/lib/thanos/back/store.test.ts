import { accountsUpdated, inited as initEvent, locked, settingsUpdated, store, unlocked } from './store'
import { ThanosAccountType, ThanosStatus } from '../types';
import { Vault } from './vault';

describe("Store tests", () => {
  it('Initial store values', () => {
    const { inited, vault, status, accounts, networks, settings } = store.getState()
    expect(inited).toBeFalsy()
    expect(vault).toBeNull()
    expect(status).toBe(ThanosStatus.Idle)
    expect(accounts).toEqual([])
    expect(networks).toEqual([])
    expect(settings).toBeNull()
  })
  it('Inited event', () => {
    initEvent(false)
    const { inited, status } = store.getState()
    expect(inited).toBeTruthy()
    expect(status).toBe(ThanosStatus.Idle)
  })
  it('Inited event with Vault', () => {
    initEvent(true)
    const { status } = store.getState()
    expect(status).toBe(ThanosStatus.Locked)
  })
  it('Locked event', () => {
    locked()
    const { status } = store.getState()
    expect(status).toBe(ThanosStatus.Locked)
  })
  it('Unlocked event', () => {
    unlocked({ vault: {} as Vault, accounts: [], settings: {} })
    const { status } = store.getState()
    expect(status).toBe(ThanosStatus.Ready)
  })
  it('Accounts updated event', () => {
    accountsUpdated([{ name: 'testName', type: ThanosAccountType.Imported, publicKeyHash: 'testHashKey' }])
    const { accounts } = store.getState()
    const { name, type, publicKeyHash } = accounts[0]
    expect(name).toBe('testName')
    expect(type).toBe(ThanosAccountType.Imported)
    expect(publicKeyHash).toBe('testHashKey')
  })
  it('Settings updated event', () => {
    settingsUpdated({})
    const { settings } = store.getState()
    expect(settings).toEqual({})
  })
})
