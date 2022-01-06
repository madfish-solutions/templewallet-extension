import { browser } from 'webextension-polyfill-ts';

import {
  fromHex,
  getDAppPublicKey,
  getOrCreateKeyPair,
  KEYPAIR_SEED_STORAGE_KEY,
  removeDAppPublicKey,
  saveDAppPublicKey,
  toHex,
  toPubKeyStorageKey
} from './beacon';

const SAMPLE_PAYLOAD = 'hello, world!';

describe('Beacon tests', () => {
  describe('Storage', () => {
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
    it('Stored key can be removed', async () => {
      await browser.storage.local.set({ beacon_something_pubkey: 'something' });
      await removeDAppPublicKey('something');
      const dappKey = await getDAppPublicKey('something');
      expect(dappKey).toBe(undefined);
    });
    it('Can write to storage', async () => {
      // await browser.storage.local.set({ beacon_something_pubkey: 'something' });
      const someKey = 'something';
      const someValue = 'somevalue';
      await saveDAppPublicKey(someKey, someValue);
      const dappKey = await getDAppPublicKey(someKey);
      expect(dappKey).toBe(someValue);
    });
  });
  describe('Hex enc/dec', () => {
    it('Decode from Hex is working', async () => {
      const buf = Buffer.from(SAMPLE_PAYLOAD, 'utf8').toString('hex');
      const hex = fromHex(buf);
      expect(hex.toString('hex')).toBe(
        Buffer.from([104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33]).toString('hex')
      );
    });
    it('Encode to Hex is working', async () => {
      const buf = Buffer.from(SAMPLE_PAYLOAD, 'utf8');
      const hex = toHex(buf);
      expect(hex).toBe(Buffer.from([104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33]).toString('hex'));
    });
  });
  describe('Seed generation', () => {
    it('Generates new valid seed', async () => {
      const keyPair = await getOrCreateKeyPair();
      expect(keyPair).toHaveProperty('keyType');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('publicKey');
    });
    it('Returns old value', async () => {
      const sampleKeyType = 'sampleKeyType';
      const samplePrivateKey = 'samplePrivateKey';
      const samplePublicKey = 'samplePublicKey';
      const sampleKeyPair = {
        keyType: sampleKeyType,
        privateKey: samplePrivateKey,
        publicKey: samplePublicKey
      };
      await browser.storage.local.set({ [KEYPAIR_SEED_STORAGE_KEY]: JSON.stringify(sampleKeyPair) });
      const keypair = await getOrCreateKeyPair();
      expect(keypair).toMatchObject(sampleKeyPair);
    });
  });
});
