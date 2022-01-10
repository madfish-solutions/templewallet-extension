// import { crypto_sign_ed25519_pk_to_curve25519, crypto_sign_ed25519_sk_to_curve25519 } from 'libsodium-wrappers';
import { browser } from 'webextension-polyfill-ts';

import {
  // createCryptoBox,
  fromHex,
  getDAppPublicKey,
  getOrCreateKeyPair,
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
    // END OF UNCHANCHABLE PART
    // it('createCryptoBox', async () => {
    //   const selfKeyPair = await getOrCreateKeyPair();
    //   const otherPublicKey = 'hehe';
    //   const kxSelfPrivateKey = crypto_sign_ed25519_sk_to_curve25519(Buffer.from(selfKeyPair.privateKey)); // Secret bytes to scalar bytes
    //   const kxSelfPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(selfKeyPair.publicKey)); // Secret bytes to scalar bytes
    //   const kxOtherPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(otherPublicKey, 'hex')); // Secret bytes to scalar bytes
    //   const buffers = await createCryptoBox(otherPublicKey, selfKeyPair);
    //   expect(kxOtherPublicKey).toEqual(buffers[2]);
    //   expect(kxSelfPublicKey).toEqual(buffers[1]);
    //   expect(kxSelfPrivateKey).toEqual(buffers[0]);
    // });
  });
});
