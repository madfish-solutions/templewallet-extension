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

const SAMPLE_PAYLOAD = 'hello, world!';

jest.mock('webextension-polyfill-ts');

const mockGet = jest.fn(async (key?) => new Promise(resolve => resolve({ beacon_something_pubkey: 'somevalue' })));
const mockSet: jest.Mock<Promise<void>> = jest.fn(async (key?) => new Promise(resolve => resolve()));
const mockRemove: jest.Mock<Promise<void>> = jest.fn(async (key?) => new Promise(resolve => resolve()));
browser.storage.local.get = jest.fn(
  async (key?) => new Promise(resolve => resolve({ beacon_something_pubkey: 'somevalue' }))
);
browser.storage.local.set = mockSet;
browser.storage.local.remove = mockRemove;

describe('Beacon', () => {
  const MOCK_ORIGINAL_KEY = 'something';
  const MOCK_MODIFIED_KEY = 'beacon_something_pubkey';
  const MOCK_ORIGINAL_VALUE = 'somevalue';
  const MOCK_STORAGE_OBJECT = { [MOCK_MODIFIED_KEY]: MOCK_ORIGINAL_VALUE };
  beforeEach(() => {
    // jest.clearAllMocks();
    mockSet.mockClear();
    mockRemove.mockClear();
    mockBrowserStorageLocal.set.mockClear();
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
      expect(mockSet).toBeCalledWith(MOCK_STORAGE_OBJECT);
    });
  });
  describe('removeDAppPublicKey', () => {
    // it('Stored key can be removed', async () => {
    //   await browser.storage.local.set(MOCK_STORAGE_OBJECT);
    //   const dappKeyBefore = await getDAppPublicKey(MOCK_ORIGINAL_KEY);
    //   expect(dappKeyBefore).toBe(MOCK_ORIGINAL_VALUE);
    //   await removeDAppPublicKey(MOCK_ORIGINAL_KEY);
    //   const dappKeyAfter = await getDAppPublicKey(MOCK_ORIGINAL_KEY);
    //   expect(dappKeyAfter).toBe(undefined);
    // });
    it('called with correct data', async () => {
      await removeDAppPublicKey(MOCK_ORIGINAL_KEY);
      expect(mockRemove).toBeCalledWith([MOCK_MODIFIED_KEY]);
    });
  });
  describe('getDAppPublicKey', () => {
    it('Stored key to be not empty', async () => {
      console.log('getDAppPublicKey 1');
      // const setStorageDataMock = jest.fn(x =>
      //   Object.keys(x).reduce((newObj: any, key: keyof typeof x) => {
      //     newObj[key] = x[key];
      //     return newObj;
      //   }, {})
      // );
      // setStorageDataMock(MOCK_STORAGE_OBJECT);
      // expect(setStorageDataMock.mock.calls.length).toBe(1);

      // // The first argument of the first call to the function was 0
      // expect(setStorageDataMock.mock.calls[0][0]).toBe(MOCK_STORAGE_OBJECT);
      // // The first argument of the second call to the function was 1
      // // The return value of the first call to the function was 42
      // expect(setStorageDataMock.mock.results[0].value).toBe(MOCK_STORAGE_OBJECT);

      // await browser.storage.local.set(MOCK_STORAGE_OBJECT);
      const dappKeyBefore = await getDAppPublicKey('something');

      expect(dappKeyBefore).toBe(undefined);

      await mockBrowserStorageLocal.set(MOCK_STORAGE_OBJECT);
      const dappKeyAfter = await getDAppPublicKey('something');
      expect(dappKeyAfter).toBe('something');
    });
    it('Not stored key to be undefined', async () => {
      console.log('getDAppPublicKey 2');
      const dappKey = await getDAppPublicKey('anotherKey');
      expect(dappKey).toBe(undefined);
    });
  });
  // describe('fromHex', () => {
  //   it('Decode from Hex is working', async () => {
  //     const buf = Buffer.from(SAMPLE_PAYLOAD, 'utf8').toString('hex');
  //     const hex = fromHex(buf);
  //     expect(hex.toString('hex')).toBe(
  //       Buffer.from([104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33]).toString('hex')
  //     );
  //   });
  // });
  // describe('toHex', () => {
  //   it('Encode to Hex is working', async () => {
  //     const buf = Buffer.from(SAMPLE_PAYLOAD, 'utf8');
  //     const hex = toHex(buf);
  //     expect(hex).toBe(Buffer.from([104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33]).toString('hex'));
  //   });
  // });
  // describe('Seed generation', () => {
  //   it('Generates new valid seed', async () => {
  //     const keyPair = await getOrCreateKeyPair();
  //     expect(keyPair).toHaveProperty('keyType');
  //     expect(keyPair).toHaveProperty('privateKey');
  //     expect(keyPair).toHaveProperty('publicKey');
  //   });
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
  // });
});
