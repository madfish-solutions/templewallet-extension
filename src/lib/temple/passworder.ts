import { Buffer } from 'buffer';

/**
 * password => passKey
 * passKey + salt => derivedPassKey
 * stuff + derivedPassKey => enc_stuff
 * enc_stuff + derivedPassKey => stuff
 *
 * Encrypt
 * 1) salt = generateSalt()
 * 2) passKey = generateKey(password*)
 * 3) derivedPassKey = deriveKey(passKey, salt)
 * 3) encryptedStuff = encrypt(stuff*, derivedPassKey)
 * 4) persist*(salt, encryptedStuff)
 *
 * Decrypt
 * 1) load*(salt, encryptedStuff)
 * 2) derivedPassKey = deriveKey(passKey*, salt)
 * 3) stuff = decrypt(encryptedStuff*, derivedPassKey)
 *
 */

export type EncryptedPayload = { dt: string; iv: string };

export async function encrypt(stuff: any, key: CryptoKey): Promise<EncryptedPayload> {
  const stuffStr = JSON.stringify(stuff);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encryptedStuff = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    Buffer.from(stuffStr)
  );

  return {
    dt: Buffer.from(encryptedStuff).toString('hex'),
    iv: Buffer.from(iv).toString('hex')
  };
}

export async function decrypt<T = any>(
  { dt: encryptedStuffHex, iv: ivHex }: EncryptedPayload,
  key: CryptoKey
): Promise<T> {
  const stuffBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Buffer.from(ivHex, 'hex') },
    key,
    Buffer.from(encryptedStuffHex, 'hex')
  );
  const stuffStr = Buffer.from(stuffBuf).toString();
  return JSON.parse(stuffStr);
}

export function generateHash(password: string) {
  return crypto.subtle.digest('SHA-256', Buffer.from(password, 'utf-8'));
}

export async function generateKey(password: string) {
  const hash = await generateHash(password);
  return importKey(hash);
}

export function deriveKey(key: CryptoKey, salt: Uint8Array, iterations = 310_000) {
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function generateSalt(byteCount = 32) {
  const view = new Uint8Array(byteCount);
  crypto.getRandomValues(view);
  return view;
}

export function importKey(keyData: ArrayBuffer) {
  return crypto.subtle.importKey('raw', keyData, 'PBKDF2', false, ['deriveBits', 'deriveKey']);
}

/**
 * @deprecated
 */
export function generateKeyLegacy(password: string) {
  return importKey(Buffer.alloc(32, password));
}

/**
 * @deprecated
 */
export function deriveKeyLegacy(key: CryptoKey, salt: Uint8Array) {
  return deriveKey(key, salt, 10_000);
}
