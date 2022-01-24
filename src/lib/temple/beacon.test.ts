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

const MOCK_STORAGE_OBJECT = { beacon_something_pubkey: 'something' };

jest.mock('webextension-polyfill-ts');

// browser.storage.local.set = jest.fn(() => console.log('data'));
// browser.storage.local = jest.fn(() => ({
//   get: jest.fn(),
//   set: jest.fn(),
//   remove: jest.fn(),
//   clear: jest.fn(),
//   QUOTA_BYTES: 10
// }));
const mockGet = jest.fn(async (key?) => new Promise(resolve => resolve({ beacon_something_pubkey: 'somevalue' })));
const mockSet = jest.fn(async (key?) => new Promise(resolve => resolve({ beacon_something_pubkey: 'somevalue' })));
browser.storage.local.get = jest.fn(
  async (key?) => new Promise(resolve => resolve({ beacon_something_pubkey: 'somevalue' }))
);
browser.storage.local.set = jest.fn(async (key?) => new Promise(resolve => resolve()));

describe('Beacon', () => {
  beforeEach(() => {
    // jest.clearAllMocks();
    mockBrowserStorageLocal.set.mockClear();
  });
  // describe('toPubKeyStorageKey', () => {
  //   it('Format public key to storage key', () => {
  //     const storageKey = toPubKeyStorageKey('myAwesomeDappKey');
  //     expect(storageKey).toBe('beacon_myAwesomeDappKey_pubkey');
  //   });
  // });
  // browser.storage.local.get
  describe('saveDAppPublicKey', () => {
    it('Can write to storage', async () => {
      console.log('saveDAppPublicKey');
      const someKey = 'something';
      const someValue = 'somevalue';
      await saveDAppPublicKey(someKey, someValue);
      const items = await browser.storage.local.get('beacon_something_pubkey');
      // console.log(dappKey);
      expect(items['beacon_something_pubkey']).toBe(someValue);
      expect(browser.storage.local.set).toBeCalledWith({ beacon_something_pubkey: someValue });
    });
  });
  // describe('removeDAppPublicKey', () => {
  //   it('Stored key can be removed', async () => {
  //     console.log('removeDAppPublicKey');
  //     // await mockBrowserStorageLocal.set(MOCK_STORAGE_OBJECT);
  //     // const dappKeyBefore = await getDAppPublicKey('something');
  //     // expect(dappKeyBefore).toBe(MOCK_STORAGE_OBJECT.beacon_something_pubkey);
  //     // await removeDAppPublicKey('something');
  //     // const dappKeyAfter = await getDAppPublicKey('something');
  //     // expect(dappKeyAfter).toBe(undefined);
  //   });
  // });
  // describe('getDAppPublicKey', () => {
  //   it('Stored key to be not empty', async () => {
  //     console.log('getDAppPublicKey 1');
  //     // const setStorageDataMock = jest.fn(x =>
  //     //   Object.keys(x).reduce((newObj: any, key: keyof typeof x) => {
  //     //     newObj[key] = x[key];
  //     //     return newObj;
  //     //   }, {})
  //     // );
  //     // setStorageDataMock(MOCK_STORAGE_OBJECT);
  //     // expect(setStorageDataMock.mock.calls.length).toBe(1);

  //     // // The first argument of the first call to the function was 0
  //     // expect(setStorageDataMock.mock.calls[0][0]).toBe(MOCK_STORAGE_OBJECT);
  //     // // The first argument of the second call to the function was 1
  //     // // The return value of the first call to the function was 42
  //     // expect(setStorageDataMock.mock.results[0].value).toBe(MOCK_STORAGE_OBJECT);

  //     // await browser.storage.local.set(MOCK_STORAGE_OBJECT);
  //     const dappKeyBefore = await getDAppPublicKey('something');

  //     expect(dappKeyBefore).toBe(undefined);

  //     await mockBrowserStorageLocal.set(MOCK_STORAGE_OBJECT);
  //     const dappKeyAfter = await getDAppPublicKey('something');
  //     expect(dappKeyAfter).toBe('something');
  //   });
  //   it('Not stored key to be undefined', async () => {
  //     console.log('getDAppPublicKey 2');
  //     const dappKey = await getDAppPublicKey('anotherKey');
  //     expect(dappKey).toBe(undefined);
  //   });
  // });
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
