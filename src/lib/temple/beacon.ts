import {
  AppMetadata,
  BeaconErrorType as ErrorType,
  Network,
  NetworkType,
  PermissionScope,
  SigningType
} from '@airgap/beacon-types';
import bs58check from 'bs58check';
import { Buffer } from 'buffer';
import {
  crypto_generichash,
  crypto_box_seal,
  ready,
  crypto_secretbox_NONCEBYTES,
  crypto_secretbox_MACBYTES,
  crypto_sign_seed_keypair,
  from_string,
  randombytes_buf,
  crypto_kx_server_session_keys,
  crypto_secretbox_easy,
  crypto_secretbox_open_easy,
  crypto_kx_client_session_keys,
  crypto_sign_ed25519_pk_to_curve25519,
  crypto_sign_ed25519_sk_to_curve25519,
  KeyPair,
  CryptoKX
} from 'libsodium-wrappers';
import memoizee from 'memoizee';
import browser from 'webextension-polyfill';

import { APP_TITLE } from 'lib/constants';
import { fetchFromStorage, putToStorage, removeFromStorage } from 'lib/storage';

export { ErrorType, NetworkType, PermissionScope, SigningType };
export type { AppMetadata, Network };

export type Request =
  | PermissionRequest
  | OperationRequest
  | SignRequest
  | BroadcastRequest
  | DisconnectMessage
  | PostMessagePairingRequest;

export type Response =
  | ErrorResponse
  | PermissionResponse
  | OperationResponse
  | SignResponse
  | BroadcastResponse
  | AcknowledgeResponse
  | DisconnectMessage
  | PostMessagePairingResponse;

export enum MessageType {
  Acknowledge = 'acknowledge',

  PermissionRequest = 'permission_request',
  SignPayloadRequest = 'sign_payload_request',
  OperationRequest = 'operation_request',
  BroadcastRequest = 'broadcast_request',
  PermissionResponse = 'permission_response',
  SignPayloadResponse = 'sign_payload_response',
  OperationResponse = 'operation_response',
  BroadcastResponse = 'broadcast_response',
  Disconnect = 'disconnect',
  Error = 'error',
  // Handshake
  HandshakeRequest = 'postmessage-pairing-request',
  HandshakeResponse = 'postmessage-pairing-response'
}

interface BaseMessage {
  type: MessageType;
  version: string;
  id: string; // ID of the message. The same ID is used in the request and response
  beaconId?: string;
  senderId?: string; // ID of the sender. This is used to identify the sender of the message
}

export interface PermissionRequest extends BaseMessage {
  type: MessageType.PermissionRequest;
  appMetadata: AppMetadata;
  network: Network;
  scopes: PermissionScope[];
}

interface PermissionResponse extends BaseMessage {
  type: MessageType.PermissionResponse;
  walletType?: 'implicit';
  network: Network; // Network on which the permissions have been granted
  publicKey: string; // Public Key, because it can be used to verify signatures
  scopes: PermissionScope[]; // Permissions that have been granted for this specific address / account
  threshold?: {
    amount: string;
    timeframe: string;
  };
}

interface AcknowledgeResponse {
  type: MessageType.Acknowledge;
  version: string;
  senderId: string;
  id: string;
}

export interface OperationRequest extends BaseMessage {
  type: MessageType.OperationRequest;
  network: Network;
  operationDetails: any[];
  sourceAddress: string;
}

interface OperationResponse extends BaseMessage {
  type: MessageType.OperationResponse;
  transactionHash: string;
}

export interface SignRequest extends BaseMessage {
  type: MessageType.SignPayloadRequest;
  sourceAddress: string;
  payload: string;
  signingType?: SigningType;
}

interface SignResponse extends BaseMessage {
  type: MessageType.SignPayloadResponse;
  signingType?: SigningType;
  signature: string;
}

interface BroadcastRequest extends BaseMessage {
  type: MessageType.BroadcastRequest;
  network: Network; // Network on which the transaction will be broadcast
  signedTransaction: string; // Signed transaction that will be broadcast
}

interface BroadcastResponse extends BaseMessage {
  type: MessageType.BroadcastResponse;
  transactionHash: string; // Hash of the broadcast transaction
}

interface ErrorResponse extends BaseMessage {
  type: MessageType.Error;
  errorType: ErrorType;
  errorData?: any[];
}

interface DisconnectMessage extends BaseMessage {
  type: MessageType.Disconnect;
}

export interface PostMessagePairingRequest extends BaseMessage {
  type: MessageType.HandshakeRequest;
  name: string;
  icon?: string; // TODO: Should this be a URL or base64 image?
  appUrl?: string;
  publicKey: string;
}

interface PostMessagePairingResponse extends BaseMessage {
  type: MessageType.HandshakeResponse;
  name: string;
  icon?: string; // TODO: Should this be a URL or base64 image?
  appUrl?: string;
  publicKey: string;
}

export function encodeMessage<T = unknown>(msg: T): string {
  return bs58check.encode(Buffer.from(JSON.stringify(msg)));
}

export function decodeMessage<T = unknown>(encoded: string): T {
  return JSON.parse(bs58check.decode(encoded).toString());
}

export function formatOpParams(op: any) {
  const { fee, gas_limit, storage_limit, ...rest } = op;
  if (op.kind === 'transaction') {
    const { to, destination, amount, parameter, parameters, ...txRest } = rest;
    return {
      ...txRest,
      to: to ?? destination,
      amount: +amount,
      mutez: true,
      parameter: parameter ?? parameters,
      fee,
      gasLimit: gas_limit,
      storageLimit: storage_limit
    };
  }

  if (op.kind === 'origination') {
    return {
      mutez: true,
      ...rest
    };
  }
  return rest;
}

/**
 * Beacon V2
 */
export const PAIRING_RESPONSE_BASE: Partial<PostMessagePairingResponse> = {
  type: MessageType.HandshakeResponse,
  name: APP_TITLE,
  icon: 'https://templewallet.com/logo.png',
  appUrl: browser.runtime.getURL('fullpage.html')
};

const KEYPAIR_SEED_STORAGE_KEY = 'beacon_keypair_seed';

export async function getSenderId(publicKeyHex?: string): Promise<string> {
  await ready;
  const publicKey = publicKeyHex ? fromHex(publicKeyHex) : (await getOrCreateKeyPair()).publicKey;
  const buffer = Buffer.from(crypto_generichash(5, publicKey));
  return bs58check.encode(buffer);
}

export async function openBeaconMessage(origin: string, msg: string, encrypted = false) {
  const recipientPubKey = await getDAppPublicKey(origin);
  let payload: { payload: string } | null = null;

  if (encrypted) {
    try {
      if (!recipientPubKey) throw new Error('<stub>');

      msg = await decryptMessage(msg, recipientPubKey);
    } catch {
      payload = {
        payload: encodeMessage<Response>({
          version: '2',
          senderId: await getSenderId(),
          id: 'stub',
          type: MessageType.Disconnect
        })
      };
      return {
        recipientPubKey,
        req: null,
        payload
      };
    }
  }

  let req: Request | null;
  try {
    req = decodeMessage<Request>(msg);
  } catch {
    req = null;
  }

  if (req) {
    if (encrypted) {
      if (!recipientPubKey || !req.senderId || req.senderId !== (await getSenderId(recipientPubKey))) {
        req = null;
      }
    } else if (req.type === MessageType.HandshakeRequest) {
      if (!req.publicKey || (req.senderId && req.senderId !== (await getSenderId(req.publicKey)))) {
        req = null;
      }
    } else if (req.type !== MessageType.Disconnect && !req.beaconId) {
      req = null;
    }
  }

  return {
    recipientPubKey,
    req,
    payload
  };
}

export async function encryptMessage(message: string, recipientPublicKey: string): Promise<string> {
  const keyPair = await getOrCreateKeyPair();
  const { sharedTx } = await createCryptoBoxClient(recipientPublicKey, keyPair);

  return encryptCryptoboxPayload(message, sharedTx);
}

export async function decryptMessage(payload: string, senderPublicKey: string) {
  const keyPair = await getOrCreateKeyPair();
  const { sharedRx } = await createCryptoBoxServer(senderPublicKey, keyPair);

  const hexPayload = Buffer.from(payload, 'hex');

  if (hexPayload.length >= crypto_secretbox_NONCEBYTES + crypto_secretbox_MACBYTES) {
    try {
      return await decryptCryptoboxPayload(hexPayload, sharedRx);
    } catch {
      /* NO-OP. We try to decode every message, but some might not be addressed to us. */
    }
  }

  throw new Error('Could not decrypt message');
}

export async function sealCryptobox(payload: string | Buffer, publicKey: Uint8Array): Promise<string> {
  await ready;

  const kxSelfPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(publicKey)); // Secret bytes to scalar bytes
  const encryptedMessage = crypto_box_seal(payload, kxSelfPublicKey);

  return toHex(encryptedMessage);
}

export async function encryptCryptoboxPayload(message: string, sharedKey: Uint8Array): Promise<string> {
  await ready;

  const nonce = Buffer.from(randombytes_buf(crypto_secretbox_NONCEBYTES));
  const combinedPayload = Buffer.concat([
    nonce,
    Buffer.from(crypto_secretbox_easy(Buffer.from(message, 'utf8'), nonce, sharedKey))
  ]);

  return toHex(combinedPayload);
}

export async function decryptCryptoboxPayload(payload: Uint8Array, sharedKey: Uint8Array): Promise<string> {
  await ready;

  const nonce = payload.slice(0, crypto_secretbox_NONCEBYTES);
  const ciphertext = payload.slice(crypto_secretbox_NONCEBYTES);

  return Buffer.from(crypto_secretbox_open_easy(ciphertext, nonce, sharedKey)).toString('utf8');
}

export async function createCryptoBoxServer(otherPublicKey: string, selfKeyPair: KeyPair): Promise<CryptoKX> {
  const keys = await createCryptoBox(otherPublicKey, selfKeyPair);

  return crypto_kx_server_session_keys(...keys);
}

export async function createCryptoBoxClient(otherPublicKey: string, selfKeyPair: KeyPair): Promise<CryptoKX> {
  const keys = await createCryptoBox(otherPublicKey, selfKeyPair);

  return crypto_kx_client_session_keys(...keys);
}

export async function createCryptoBox(
  otherPublicKey: string,
  selfKeyPair: KeyPair
): Promise<[Uint8Array, Uint8Array, Uint8Array]> {
  // TODO: Don't calculate it every time?
  const kxSelfPrivateKey = crypto_sign_ed25519_sk_to_curve25519(Buffer.from(selfKeyPair.privateKey)); // Secret bytes to scalar bytes
  const kxSelfPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(selfKeyPair.publicKey)); // Secret bytes to scalar bytes
  const kxOtherPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(otherPublicKey, 'hex')); // Secret bytes to scalar bytes

  return [Buffer.from(kxSelfPublicKey), Buffer.from(kxSelfPrivateKey), Buffer.from(kxOtherPublicKey)];
}

export const getOrCreateKeyPair = memoizee(
  async () => {
    let seed = await fetchFromStorage<string>(KEYPAIR_SEED_STORAGE_KEY);

    if (seed === null) {
      const newSeed = generateNewSeed();
      await putToStorage(KEYPAIR_SEED_STORAGE_KEY, newSeed);
      seed = newSeed;
    }

    await ready;

    return crypto_sign_seed_keypair(crypto_generichash(32, from_string(seed)));
  },
  { maxAge: 60_000, promise: true }
);

export async function getDAppPublicKey(origin: string) {
  return await fetchFromStorage<string>(toPubKeyStorageKey(origin));
}

export async function saveDAppPublicKey(origin: string, publicKey: string) {
  await putToStorage(toPubKeyStorageKey(origin), publicKey);
}

export async function removeDAppPublicKey(origin: string | string[]) {
  const keys = Array.isArray(origin) ? origin.map(o => toPubKeyStorageKey(o)) : toPubKeyStorageKey(origin);
  await removeFromStorage(keys);
}

export function generateNewSeed() {
  const view = new Uint8Array(32);
  crypto.getRandomValues(view);
  return toHex(view);
}

export function toHex(term: Uint8Array | Buffer) {
  return Buffer.from(term).toString('hex');
}

export function fromHex(term: string) {
  return Buffer.from(term, 'hex');
}

export function toPubKeyStorageKey(origin: string) {
  return `beacon_${origin}_pubkey`;
}
