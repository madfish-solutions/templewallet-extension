const { Crypto, CryptoKey } = require('@peculiar/webcrypto');

Object.assign(global, {
  crypto: new Crypto(),
  CryptoKey
});

jest.mock('lib/temple/repo', () => ({
  db: {
    delete: jest.fn(),
    open: jest.fn()
  }
}));
