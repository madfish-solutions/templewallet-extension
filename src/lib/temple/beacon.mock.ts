const mockGet: jest.Mock<Promise<any>> = jest.fn(
  async () => new Promise(resolve => resolve({ beacon_something_pubkey: 'somevalue' }))
);
const mockSet: jest.Mock<Promise<void>> = jest.fn(async () => new Promise(resolve => resolve()));
const mockRemove: jest.Mock<Promise<void>> = jest.fn(async () => new Promise(resolve => resolve()));

export const mockBrowserStorageLocal = {
  get: mockGet,
  set: mockSet,
  remove: mockRemove
};

export const mockCryptoUtil = {
  getRandomValues: jest.fn()
};

export const mockSodiumUtil = {
  crypto_generichash: jest.fn(() => ({})),
  crypto_sign_seed_keypair: jest.fn(() => ({
    privateKey: 'mock privateKey',
    publicKey: 'mock publicKey',
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
  crypto_box_seal: jest.fn(() => ({}))
};
