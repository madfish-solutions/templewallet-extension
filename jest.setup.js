const { Crypto, CryptoKey } = require("@peculiar/webcrypto");

Object.assign(global, {
  crypto: new Crypto(),
  CryptoKey,
});
