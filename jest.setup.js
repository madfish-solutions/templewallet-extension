const { Crypto, CryptoKey } = require('@peculiar/webcrypto');

/** `TextEncoder` is not yet supported (injected) by Jest.
  See: https://github.com/jsdom/jsdom/issues/2524

  TextEncoder of Node.js is no good:
  ```
  new require('util').TextEncoder().encode('abc') instanceof Uint8Array // false
  ```
*/
const { TextEncoder, TextDecoder } = require('text-decoding');

Object.assign(global, {
  crypto: new Crypto(),
  CryptoKey,
  TextEncoder,
  TextDecoder,
});

jest.mock('lib/temple/repo', () => ({
  db: {
    delete: jest.fn(),
    open: jest.fn()
  }
}));
