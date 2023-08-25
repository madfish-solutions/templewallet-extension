/**
 * Module used for encryption inside Temple,
 * has to be definitely covered with tests
 * to ensure nothing changes in the algo of ecryption
 */

import * as Passworder from '../passworder';

const PASSWORD = 'abcde123';
const STUFF_TO_ENCRYPT = { hello: 'world' };

describe('Passworder generating', () => {
  it('Generating salt', async () => {
    const salt = Passworder.generateSalt();
    expect(salt instanceof Uint8Array).toBeTruthy();
    expect(salt.length).toBe(32);
  });

  it('Generating crypto key', async () => {
    const key = await Passworder.generateKey(PASSWORD);
    expect(key instanceof CryptoKey).toBeTruthy();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('PBKDF2');
    expect(key.usages).toStrictEqual(['deriveBits', 'deriveKey']);
    expect(key.extractable).toBe(false);
  });
});

let passKey: CryptoKey;

describe('Passworder usage', () => {
  beforeAll(async () => {
    passKey = await Passworder.generateKey(PASSWORD);
  });

  it('Deriving crypto key', async () => {
    const salt = Passworder.generateSalt();
    const derivedKey = await Passworder.deriveKey(passKey, salt);
    expect(derivedKey instanceof CryptoKey).toBeTruthy();
    expect(derivedKey.type).toBe('secret');
    expect(derivedKey.algorithm.name).toBe('AES-GCM');
    expect(derivedKey.usages).toStrictEqual(['encrypt', 'decrypt']);
    expect(derivedKey.extractable).toBe(false);
  });

  it('Encrypt/decrypt', async () => {
    const salt = Passworder.generateSalt();
    const derivedKey = await Passworder.deriveKey(passKey, salt);
    const ecnrypted = await Passworder.encrypt(STUFF_TO_ENCRYPT, derivedKey);
    const decrypted = await Passworder.decrypt(ecnrypted, derivedKey);
    expect(decrypted).toStrictEqual(STUFF_TO_ENCRYPT);
  });
});
