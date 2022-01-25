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
  crypto_sign_ed25519_pk_to_curve25519: jest.fn(),
  crypto_sign_ed25519_sk_to_curve25519: jest.fn()
};
