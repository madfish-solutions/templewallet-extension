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
