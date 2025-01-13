import { templeWalletApi } from './endpoints/templewallet.api';

/** Result for packing (via `import('@taquito/michel-codec').packDataBytes({ string })`) in bytes for message:
 * `Tezos Signed Message: Confirming my identity as ${Account PKH}.\n\nNonce: ${nonce}`
 */
export const TEZ_SIG_AUTH_MSG_PATTERN =
  /^0501[a-f0-9]{8}54657a6f73205369676e6564204d6573736167653a20436f6e6669726d696e67206d79206964656e7469747920617320[a-f0-9]{72}2e0a0a4e6f6e63653a20[a-f0-9]{16,40}$/;

interface SigningNonce {
  value: string;
  /** ISO string time */
  expiresAt: string;
}

async function fetchTempleSigningNonce(pkh: string) {
  const { data } = await templeWalletApi.get<SigningNonce>('signing-nonce', { params: { pkh } });

  return data;
}

export interface SigAuthValues {
  publicKey: string;
  messageBytes: string;
  signature: string;
}

export function buildSigAuthHeaders({ publicKey, messageBytes, signature }: SigAuthValues) {
  return {
    'tw-sig-auth-tez-pk': publicKey,
    'tw-sig-auth-tez-msg': messageBytes,
    'tw-sig-auth-tez-sig': signature
  };
}

export async function makeSigAuthMessageBytes(accountPkh: string) {
  const { packDataBytes } = await import('@taquito/michel-codec');

  const nonce = await fetchTempleSigningNonce(accountPkh);

  const message = `Tezos Signed Message: Confirming my identity as ${accountPkh}.\n\nNonce: ${nonce.value}`;

  return packDataBytes({ string: message }).bytes;
}
