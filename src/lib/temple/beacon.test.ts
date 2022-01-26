import { browser } from 'webextension-polyfill-ts';

import {
  createCryptoBox,
  createCryptoBoxClient,
  createCryptoBoxServer,
  decryptCryptoboxPayload,
  decryptMessage,
  encryptCryptoboxPayload,
  encryptMessage,
  fromHex,
  generateNewSeed,
  getDAppPublicKey,
  getOrCreateKeyPair,
  getSenderId,
  PAIRING_RESPONSE_BASE,
  removeDAppPublicKey,
  saveDAppPublicKey,
  sealCryptobox,
  toHex,
  toPubKeyStorageKey,
  Request,
  Response,
  decodeMessage,
  PostMessagePairingRequest,
  formatOpParams,
  OperationRequest,
  encodeMessage,
  MessageType
} from './beacon';
import { mockBrowserStorageLocal, mockCryptoUtil } from './beacon.mock';

browser.storage.local = { ...browser.storage.local, ...mockBrowserStorageLocal };
global.crypto = { ...crypto, ...mockCryptoUtil };

jest.mock('libsodium-wrappers', () => ({
  ...jest.requireActual('libsodium-wrappers'),
  crypto_generichash: jest.fn(() => 'mock string'),
  crypto_sign_seed_keypair: jest.fn(() => ({
    privateKey: 'mock privateKey',
    publicKey: Buffer.from('444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1'),
    keyType: 'ed'
  })),
  crypto_sign_ed25519_pk_to_curve25519: jest.fn(() =>
    Buffer.from([109, 111, 99, 107, 32, 101, 100, 112, 107, 115, 105, 103])
  ),
  crypto_sign_ed25519_sk_to_curve25519: jest.fn(() => 'mock edsksig'),
  crypto_kx_client_session_keys: jest.fn(() => ({
    sharedRx: new Uint8Array(),
    sharedTx: new Uint8Array()
  })),
  crypto_kx_server_session_keys: jest.fn(() => ({
    sharedRx: new Uint8Array(),
    sharedTx: new Uint8Array()
  })),
  crypto_secretbox_open_easy: jest.fn(() => 'mock secretbox'),
  crypto_secretbox_easy: jest.fn(() => 'mock secretbox easy'),
  randombytes_buf: jest.fn(() => 'mock randombytes'),
  crypto_box_seal: jest.fn(() => Buffer.from('mock cryptobox seal'))
}));

const MOCK_PUBLIC_KEY = '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1';

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
    // it('called with correct arguments', async () => {
    //   await getOrCreateKeyPair();
    //   // expect(mockSodiumUtil.crypto_sign_seed_keypair).toBeCalledWith({});
    //   expect(testFunc).toBeCalledWith(32, {});
    // });
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
      const buffers = await createCryptoBox(MOCK_PUBLIC_KEY, selfKeyPair);
      expect(buffers.length).toEqual(3);
    });
  });
  describe('createCryptoBoxClient', () => {
    it('To have valid properties', async () => {
      const keyPair = await getOrCreateKeyPair();
      const cryptoClient = await createCryptoBoxClient(MOCK_PUBLIC_KEY, keyPair);
      expect(cryptoClient).toHaveProperty('sharedRx');
      expect(cryptoClient).toHaveProperty('sharedTx');
    });
  });
  describe('createCryptoBoxServer', () => {
    it('To have valid properties', async () => {
      const keyPair = await getOrCreateKeyPair();
      const cryptoClient = await createCryptoBoxServer(MOCK_PUBLIC_KEY, keyPair);
      expect(cryptoClient).toHaveProperty('sharedRx');
      expect(cryptoClient).toHaveProperty('sharedTx');
    });
  });
  describe('decryptCryptoboxPayload', () => {
    it('To be able decrypt payload', async () => {
      const keyPair = await getOrCreateKeyPair();
      const { sharedRx } = await createCryptoBoxServer(MOCK_PUBLIC_KEY, keyPair);
      const payload = 'mock payload';
      const hexPayload = Buffer.from(payload, 'hex');
      const decryptedMessage = await decryptCryptoboxPayload(hexPayload, sharedRx);
      expect(decryptedMessage).toStrictEqual('mock secretbox');
    });
  });
  describe('encryptCryptoboxPayload', () => {
    it('To be able encrypt payload', async () => {
      const keyPair = await getOrCreateKeyPair();
      const { sharedTx } = await createCryptoBoxClient(MOCK_PUBLIC_KEY, keyPair);
      const message = 'mock payload';
      const payload = await encryptCryptoboxPayload(message, sharedTx);
      expect(typeof payload).toBe('string');
    });
  });
  describe('sealCryptobox', () => {
    it('To be able seal cryptobox', async () => {
      const msg =
        '2s7MQwsWc93RsbS7VtKyK7Ln1gSHiAxLAttfL22sFreVaB3qEdy63bV6WSsAMAWi5XLVyn6sDKhju4p4XDDDATMpk7wHmPMYG2G13Eas1ens89zDyZkmZsV7DKdLaNW9aB6pup4WuAJruEpj4u6Y4seeui9qCtTw1V3tXLM9k95ze4s6ofxTyuNdy9PgRxLvsMrTbBoA7ETK1SWKh3ZduoTpgaCnexb4yq';
      const req: Request = decodeMessage<PostMessagePairingRequest>(msg);
      const keyPair = await getOrCreateKeyPair();
      const resBase = {
        version: req.version,
        id: req.id,
        ...(req.beaconId ? { beaconId: 'id' } : { senderId: await getSenderId() })
      };
      const result = await sealCryptobox(
        JSON.stringify({
          ...resBase,
          ...PAIRING_RESPONSE_BASE,
          publicKey: toHex(keyPair.publicKey)
        }),
        fromHex(req.publicKey)
      );
      expect(typeof result).toBe('string');
    });
  });
  describe('decryptMessage', () => {
    it('To be not able decrypt incorrect message', async () => {
      const w = async () => {
        const message = 'mock payload';
        const encMessage = Buffer.from(message, 'hex').toString();
        try {
          await decryptMessage(encMessage, MOCK_PUBLIC_KEY);
        } catch (e) {
          expect(e).toBeInstanceOf(Error);
        }
      };
      await w();
    });
  });
  describe('encryptMessage', () => {
    it('To be able decrypt sample message', async () => {
      const message = 'mock payload';
      const payload = await encryptMessage(message, MOCK_PUBLIC_KEY);
      expect(typeof payload).toBe('string');
    });
  });
  describe('getSenderId', () => {
    it('To be valid payload', async () => {
      const message = await getSenderId();
      expect(message).toBe('44aQjTPHmtoriWAoTuz1e');
    });
  });
  describe('formatOpParams', () => {
    it('To be valid payload without changes', async () => {
      const msg =
        'T98o3bvBdnAk5D33JLxXF95DvXJnW2hv48znPDAxAHecuovmVUXaDBwvtkdPH5HnQ1SRZCPCUYBZXT7QUTni51xRQ9qBChsZCaUDbR7mMwDwbpq3';
      const req: Request = decodeMessage<OperationRequest>(msg);
      const message = await req.operationDetails.map(formatOpParams);
      expect(message).toStrictEqual([
        {
          kind: 'noop'
        }
      ]);
    });
    it('To be valid payload for transaction', async () => {
      const msg =
        '654x25rCB9HXuAs1qSZ1AP7NSqApzqwS56p2QTas2qvtf2CPDig8VjtN9unBt27PivDNeapzMePNKQ7isfHLRVZHgzM5kUj17YnNw4ZSuPiB6QX1gGRy6ZTCResPEJToBBRCmNkciu2AY17Efm6w6xsL2PTsS9RUfXEWVH6KhZkswVhoSskcEZNqEUgdm8qeFMw4eWPAaHejU4be';
      const req: Request = decodeMessage<OperationRequest>(msg);
      const message = await req.operationDetails.map(formatOpParams);
      expect(message).toStrictEqual([
        { amount: 8, fee: 2, gasLimit: 4, kind: 'transaction', mutez: true, parameter: 9, storageLimit: 5, to: 6 }
      ]);
    });
    it('To be valid payload for origination', async () => {
      const msg =
        '5NbQMW2kTqt8fvxmArwKQcrT5JQJLyUcYtBAouNB4YEs4PNVY2ginrMNCLK1WmpeuhxMpDJpyRLZ9EGT7ddyM1uHqu8Yp92nQQturL2xoYChC5bpNTdUzHZH1S';
      const req: Request = decodeMessage<OperationRequest>(msg);
      const message = await req.operationDetails.map(formatOpParams);
      expect(message).toStrictEqual([
        {
          kind: 'origination',
          mutez: true
        }
      ]);
    });
  });
  describe('decodeMessage', () => {
    it('To be valid payload', async () => {
      const msg = 'aRN6xNrZy8M6MiswDWzg68Npu69JqR';
      const req: Request = decodeMessage<Request>(msg);
      expect(req).toStrictEqual({ payload: 'mock' });
    });
  });
  describe('encodeMessage', () => {
    it('To be valid payload', async () => {
      const resMsg = encodeMessage<Response>({
        version: '2',
        senderId: await getSenderId(),
        id: 'stub',
        type: MessageType.Disconnect
      });
      expect(resMsg).toBe(
        '3x44L9TS1aRrZ9jq8CQRb1hiFGyuYktgX5DUBLrwNdhxoRcNiVdwgBCpqXt1qnLkrNGaBGJetv1u6iV83Zp3iCDPepqYgExtTtu53vEr6nDxoPQtvuiAfJ'
      );
    });
  });
});
