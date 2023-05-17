import crypto from 'crypto';

import { MERCHANT_CODE } from './config';

const PRIVATE_KEY = process.env.BC_PRIVATE_KEY!;
const PUBLIC_KEY = process.env.BC_PUBLIC_KEY!;

const PRIVATE_KEY_START_LINE = '-----BEGIN PRIVATE KEY-----';
const PRIVATE_KEY_END_LINE = '-----END PRIVATE KEY-----';
const PUBLIC_KEY_START_LINE = '-----BEGIN PUBLIC KEY-----';
const PUBLIC_KEY_END_LINE = '-----END PUBLIC KEY-----';

export async function buildGetSignature(timestamp: number, merchant_code = MERCHANT_CODE) {
  return sign(`merchantCode=${merchant_code}&timestamp=${timestamp}`);
}

export async function buildPostSignature(payload: string, timestamp: number, merchant_code = MERCHANT_CODE) {
  return sign(`${payload}&merchantCode=${merchant_code}&timestamp=${timestamp}`);
}

/**
 * Private key is an RSA PKCS8, PEM-encoded string value.
 *
 * It might come both, with or without start & end lines:
 * ```
 * -----BEGIN PRIVATE KEY-----
 * ${PRIVATE KEY}
 * -----END PRIVATE KEY-----
 * ```
 */
export function sign(rawData: string, privateKey: string = PRIVATE_KEY) {
  // formatting for the case of start & end lines missing
  privateKey = privateKey.startsWith(PRIVATE_KEY_START_LINE)
    ? privateKey
    : `${PRIVATE_KEY_START_LINE}\n${privateKey.trim()}\n${PRIVATE_KEY_END_LINE}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(rawData);
  const signature = signer.sign(privateKey, 'base64');

  return signature;
}

export function validate(rawData: string, sign: string, publicKey: string = PUBLIC_KEY) {
  // formatting for the case of start & end lines missing
  publicKey = publicKey.startsWith(PUBLIC_KEY_START_LINE)
    ? publicKey
    : `${PUBLIC_KEY_START_LINE}\n${publicKey.trim()}\n${PUBLIC_KEY_END_LINE}`;

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(rawData);
  const result = verifier.verify(publicKey, sign, 'base64');

  return result;
}

// function generateHash(data: string) {
// 	return crypto.subtle.digest('SHA-256', Buffer.from(data, 'utf-8'));
// }

// const arrayBufferToString = (buf: ArrayBuffer) =>
// 	String.fromCharCode.apply(
// 		null,
// 		// @ts-ignore
// 		new Uint16Array(buf)
// 	);
