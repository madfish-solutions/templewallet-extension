import { LedgerSigner, LedgerTransport, DerivationType } from '@taquito/ledger-signer';
import { b58DecodeAndCheckPrefix, b58Encode, buf2hex, hex2buf, mergebuf, PrefixV2 } from '@taquito/utils';
import * as elliptic from 'elliptic';
import * as sodium from 'libsodium-wrappers';
import { crypto_sign_verify_detached, crypto_generichash } from 'libsodium-wrappers';
import toBuffer from 'typedarray-to-buffer';

import { DEFAULT_TEZOS_DERIVATION_PATH } from 'lib/constants';

import { isPkRetrievalError, isPkhRetrievalError, toLedgerError } from './helpers';

export class TempleLedgerSigner extends LedgerSigner {
  constructor(
    transport: LedgerTransport,
    path: string = DEFAULT_TEZOS_DERIVATION_PATH,
    prompt: boolean = true,
    derivationType: DerivationType = DerivationType.ED25519,
    private accPublicKey?: string,
    private accPublicKeyHash?: string
  ) {
    super(transport, path, prompt, derivationType);
  }

  async publicKey() {
    return this.accPublicKey ?? this.withErrorCauseThrow(() => super.publicKey(), isPkRetrievalError);
  }

  async publicKeyHash() {
    return this.accPublicKeyHash ?? this.withErrorCauseThrow(() => super.publicKeyHash(), isPkhRetrievalError);
  }

  private async withErrorCauseThrow<T extends Error & { cause?: any }, R>(
    fn: () => Promise<R>,
    isExpectedError: (error: unknown) => error is T
  ) {
    return fn().catch(err => {
      if (isExpectedError(err) && err.cause instanceof Error) {
        throw err.cause;
      }

      throw err;
    });
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    const result = await super.sign(bytes, watermark).catch(err => {
      throw toLedgerError(err);
    });

    let bb = hex2buf(bytes);
    if (typeof watermark !== 'undefined') {
      bb = mergebuf(watermark, bb);
    }
    const watermarkedBytes = buf2hex(toBuffer(bb));
    const signatureVerified = await this.verify(watermarkedBytes, result.prefixSig);

    if (!signatureVerified) {
      throw toLedgerError(
        new Error(
          'Signature failed verification against public key.' +
            ' Maybe the account on your device does not match' +
            ' the account from which you are trying to perform the action.'
        )
      );
    }

    return result;
  }

  async verify(bytes: string, signature: string) {
    await sodium.ready;
    const publicKey = await this.publicKey();
    const pkh = await this.publicKeyHash();
    return verifySignature(bytes, signature, publicKey, pkh);
  }
}

export type curves = 'ed' | 'p2' | 'sp';

export const prefNames = {
  ed: {
    pk: PrefixV2.Ed25519PublicKey,
    sk: PrefixV2.Ed25519SecretKey,
    pkh: PrefixV2.Ed25519PublicKeyHash,
    sig: PrefixV2.Ed25519Signature
  },
  p2: {
    pk: PrefixV2.P256PublicKey,
    sk: PrefixV2.P256SecretKey,
    pkh: PrefixV2.P256PublicKeyHash,
    sig: PrefixV2.P256Signature
  },
  sp: {
    pk: PrefixV2.Secp256k1PublicKey,
    sk: PrefixV2.Secp256k1SecretKey,
    pkh: PrefixV2.Secp256k1PublicKeyHash,
    sig: PrefixV2.Secp256k1Signature
  }
};

const validSignaturePrefixes = ['sig', 'edsig', 'spsig', 'p2sig'];

export const verifySignature = (bytes: string, signature: string, publicKey: string, pkh: string) => {
  const curve = publicKey.substring(0, 2) as curves;
  const _publicKey = new Uint8Array(toBuffer(b58DecodeAndCheckPrefix(publicKey, [prefNames[curve].pk], true)));

  const signaturePrefix = signature.startsWith('sig') ? signature.substring(0, 3) : signature.substring(0, 5);

  if (!validSignaturePrefixes.includes(signaturePrefix)) {
    throw new Error(`Unsupported signature given by remote signer: ${signature}`);
  }

  const publicKeyHash = b58Encode(crypto_generichash(20, _publicKey), prefNames[curve].pkh);
  if (publicKeyHash !== pkh) {
    throw new Error(
      `Requested public key does not match the initialized public key hash: {
          publicKey: ${publicKey},
          publicKeyHash: ${pkh}
        }`
    );
  }

  const sig = new Uint8Array(getSig(signature, curve, prefNames));

  const bytesHash = crypto_generichash(32, hex2buf(bytes));

  if (curve === 'ed') {
    return safeSignEdData(sig, bytesHash, _publicKey);
  }

  if (curve === 'sp') {
    return safeSignSpData(sig, bytesHash, _publicKey);
  }

  if (curve === 'p2') {
    return safeSignP2Data(sig, bytesHash, _publicKey);
  }

  throw new Error(`Curve '${curve}' not supported`);
};

export const getSig = (signature: string, curve: any, prefNames: any) => {
  let sig;
  if (signature.substring(0, 3) === 'sig') {
    sig = b58DecodeAndCheckPrefix(signature, [PrefixV2.GenericSignature], true);
  } else if (signature.substring(0, 5) === `${curve}sig`) {
    sig = b58DecodeAndCheckPrefix(signature, [prefNames[curve].sig], true);
  } else {
    throw new Error(`Invalid signature provided: ${signature}`);
  }
  return sig;
};

export const safeSignEdData = (sig: Uint8Array, bytesHash: Uint8Array, _publicKey: any) => {
  try {
    return crypto_sign_verify_detached(sig, bytesHash, _publicKey);
  } catch {
    return false;
  }
};

export const safeSignSpData = (sig: Uint8Array, bytesHash: Uint8Array, _publicKey: any) => {
  const key = new elliptic.ec('secp256k1').keyFromPublic(_publicKey);
  const hexSig = buf2hex(toBuffer(sig));
  const match = hexSig.match(/([a-f\d]{64})/gi);
  if (match) {
    try {
      const [r, s] = match;
      return key.verify(bytesHash, { r, s });
    } catch {
      return false;
    }
  }
  return false;
};

export const safeSignP2Data = (sig: Uint8Array, bytesHash: Uint8Array, _publicKey: any) => {
  const key = new elliptic.ec('p256').keyFromPublic(_publicKey);
  const hexSig = buf2hex(toBuffer(sig));
  const match = hexSig.match(/([a-f\d]{64})/gi);
  if (match) {
    try {
      const [r, s] = match;
      return key.verify(bytesHash, { r, s });
    } catch {
      return false;
    }
  }
  return false;
};
