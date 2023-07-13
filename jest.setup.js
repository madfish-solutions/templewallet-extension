const { Crypto, CryptoKey } = require('@peculiar/webcrypto');

Object.assign(global, {
  crypto: new Crypto(),
  CryptoKey
});

jest.mock('mem', () => {
  return function memoize(fn) {
    return fn;
  };
});

jest.mock('lib/temple/repo', () => ({
  db: {
    delete: jest.fn(),
    open: jest.fn()
  }
}));
