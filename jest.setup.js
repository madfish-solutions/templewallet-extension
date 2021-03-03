const { Crypto } = require("@peculiar/webcrypto");

global.crypto = new Crypto();
