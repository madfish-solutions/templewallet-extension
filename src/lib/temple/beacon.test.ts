import { browser } from 'webextension-polyfill-ts';

import {
  fromHex,
  getDAppPublicKey,
  getOrCreateKeyPair,
  removeDAppPublicKey,
  saveDAppPublicKey,
  toHex,
  toPubKeyStorageKey
} from './beacon';
import { mockBrowserStorageLocal } from './beacon.mock';

browser.storage.local = { ...browser.storage.local, ...mockBrowserStorageLocal };

describe('Beacon', () => {
  const MOCK_ORIGINAL_KEY = 'something';
  const MOCK_MODIFIED_KEY = 'beacon_something_pubkey';
  const MOCK_ORIGINAL_VALUE = 'somevalue';
  const MOCK_STORAGE_OBJECT = { [MOCK_MODIFIED_KEY]: MOCK_ORIGINAL_VALUE };
  const SAMPLE_PAYLOAD = 'hello, world!';

  beforeEach(() => {
    mockBrowserStorageLocal.set.mockClear();
    mockBrowserStorageLocal.remove.mockClear();
  });
  describe('toPubKeyStorageKey', () => {
    it('Format public key to storage key', () => {
      const storageKey = toPubKeyStorageKey('myAwesomeDappKey');
      expect(storageKey).toBe('beacon_myAwesomeDappKey_pubkey');
    });
  });
  describe('saveDAppPublicKey', () => {
    it('called with correct arguments', async () => {
      await saveDAppPublicKey(MOCK_ORIGINAL_KEY, MOCK_ORIGINAL_VALUE);
      expect(mockBrowserStorageLocal.set).toBeCalledWith(MOCK_STORAGE_OBJECT);
    });
  });
  describe('removeDAppPublicKey', () => {
    it('called with correct data', async () => {
      await removeDAppPublicKey(MOCK_ORIGINAL_KEY);
      expect(mockBrowserStorageLocal.remove).toBeCalledWith([MOCK_MODIFIED_KEY]);
    });
  });
  describe('getDAppPublicKey', () => {
    it('called with correct arguments', async () => {
      await getDAppPublicKey(MOCK_ORIGINAL_KEY);
      expect(mockBrowserStorageLocal.get).toBeCalledWith([MOCK_MODIFIED_KEY]);
    });
  });
  describe('fromHex', () => {
    it('Decode from Hex is working', async () => {
      const buf = Buffer.from(SAMPLE_PAYLOAD, 'utf8').toString('hex');
      const hex = fromHex(buf);
      expect(hex.toString('hex')).toBe(
        Buffer.from([104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33]).toString('hex')
      );
    });
  });
  describe('toHex', () => {
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
    //   // END OF UNCHANCHABLE PART
    //   // it('createCryptoBox', async () => {
    //   //   const selfKeyPair = await getOrCreateKeyPair();
    //   //   const otherPublicKey = 'hehe';
    //   //   const kxSelfPrivateKey = crypto_sign_ed25519_sk_to_curve25519(Buffer.from(selfKeyPair.privateKey)); // Secret bytes to scalar bytes
    //   //   const kxSelfPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(selfKeyPair.publicKey)); // Secret bytes to scalar bytes
    //   //   const kxOtherPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(otherPublicKey, 'hex')); // Secret bytes to scalar bytes
    //   //   const buffers = await createCryptoBox(otherPublicKey, selfKeyPair);
    //   //   expect(kxOtherPublicKey).toEqual(buffers[2]);
    //   //   expect(kxSelfPublicKey).toEqual(buffers[1]);
    //   //   expect(kxSelfPrivateKey).toEqual(buffers[0]);
    //   // });
  });
});
