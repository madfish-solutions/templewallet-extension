import { browser } from 'webextension-polyfill-ts';

import {
  createCryptoBox,
  fromHex,
  generateNewSeed,
  getDAppPublicKey,
  getOrCreateKeyPair,
  removeDAppPublicKey,
  saveDAppPublicKey,
  toHex,
  toPubKeyStorageKey
} from './beacon';
import { mockBrowserStorageLocal, mockCryptoUtil } from './beacon.mock';

browser.storage.local = { ...browser.storage.local, ...mockBrowserStorageLocal };
global.crypto = { ...crypto, ...mockCryptoUtil };

jest.mock('libsodium-wrappers', () => ({
  ...jest.requireActual('libsodium-wrappers'),
  crypto_generichash: jest.fn(() => ({})),
  crypto_sign_seed_keypair: jest.fn(() => ({
    privateKey: 'mock privateKey',
    publicKey: 'mock publicKey',
    keyType: 'ed'
  })),
  crypto_sign_ed25519_pk_to_curve25519: jest.fn(() =>
    Buffer.from([109, 111, 99, 107, 32, 101, 100, 112, 107, 115, 105, 103])
  ),
  crypto_sign_ed25519_sk_to_curve25519: jest.fn(() => 'mock edsksig')
}));

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
      const bufferMock = Buffer.from(SAMPLE_PAYLOAD, 'utf8').toString('hex');
      const termMock = fromHex(bufferMock);
      expect(typeof termMock).toBe('object');
    });
  });
  describe('toHex', () => {
    it('Encode to Hex is working', async () => {
      const termMock = Buffer.from(SAMPLE_PAYLOAD, 'utf8');
      const bufferMock = toHex(termMock);
      expect(bufferMock.toString()).toBe('68656c6c6f2c20776f726c6421');
    });
  });
  describe('getOrCreateKeyPair', () => {
    it('Generates new valid seed', async () => {
      const keyPair = await getOrCreateKeyPair();
      expect(keyPair).toHaveProperty('keyType');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('publicKey');
    });
  });
  describe('generateNewSeed', () => {
    beforeEach(() => {
      mockCryptoUtil.getRandomValues.mockClear();
    });
    it('should generate 64 cryptographically safe random bytes by default', () => {
      const output = generateNewSeed();
      expect(output).toHaveLength(64);
      expect(mockCryptoUtil.getRandomValues).toBeCalledWith(new Uint8Array(32));
    });
  });
  describe('createCryptoBox', () => {
    it('Generates valid box from keypair and public key', async () => {
      const selfKeyPair = await getOrCreateKeyPair();
      const otherPublicKey = '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1';
      // const kxSelfPrivateKey = crypto_sign_ed25519_sk_to_curve25519(
      //   new Uint8Array(Buffer.from(selfKeyPair.privateKey))
      // );
      // const kxSelfPublicKey = crypto_sign_ed25519_pk_to_curve25519(new Uint8Array(Buffer.from(selfKeyPair.publicKey)));
      // const kxOtherPublicKey = crypto_sign_ed25519_pk_to_curve25519(new Uint8Array(Buffer.from(otherPublicKey, 'hex')));
      const buffers = await createCryptoBox(otherPublicKey, selfKeyPair);
      expect(buffers.length).toEqual(3);
      // expect(kxSelfPublicKey).toEqual(buffers[1]);
      // expect(kxSelfPrivateKey).toEqual(buffers[0]);
      // expect(crypto_sign_ed25519_sk_to_curve25519).toBeCalledWith(Buffer.from(selfKeyPair.privateKey));
      // expect(crypto_sign_ed25519_pk_to_curve25519).toBeCalledWith(Buffer.from(selfKeyPair.publicKey));
      // expect(crypto_sign_ed25519_pk_to_curve25519).toBeCalledWith(Buffer.from(otherPublicKey, 'hex'));
    });
  });
});
