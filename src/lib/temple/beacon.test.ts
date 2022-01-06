import { browser } from 'webextension-polyfill-ts';

import { getDAppPublicKey, toPubKeyStorageKey } from './beacon';

describe('Beacon tests', () => {
  it('Format public key to storage key', () => {
    const storageKey = toPubKeyStorageKey('myAwesomeDappKey');
    expect(storageKey).toBe('beacon_myAwesomeDappKey_pubkey');
  });
  it('Stored key to be not empty', async () => {
    await browser.storage.local.set({ beacon_something_pubkey: 'something' });
    const dappKey = await getDAppPublicKey('something');
    expect(dappKey).toBe('something');
  });
  it('Not stored key to be undefined', async () => {
    const dappKey = await getDAppPublicKey('anotherKey');
    expect(dappKey).toBe(undefined);
  });
});
