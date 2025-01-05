import { templeWalletApi } from './endpoints/templewallet.api';

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
  const nonce = await fetchTempleSigningNonce(accountPkh);

  const message = `Tezos Signed Message: Confirming my identity as ${accountPkh}.\n\nNonce: ${nonce.value}`;

  const messageBytes = stringToSigningPayload(message);

  return messageBytes;
}

/**
 * See: https://tezostaquito.io/docs/signing/#generating-a-signature-with-beacon-sdk
 *
 * Same payload goes without Beacon.
 */
function stringToSigningPayload(value: string) {
  const bytes = stringToHex(value);

  const bytesLength = (bytes.length / 2).toString(16);
  const addPadding = `00000000${bytesLength}`;
  const paddedBytesLength = addPadding.slice(addPadding.length - 8);

  return '0501' + paddedBytesLength + bytes;
}

function stringToHex(value: string) {
  const buffer = new TextEncoder().encode(value);
  const hexArray = Array.from(buffer, byte => byte.toString(16).padStart(2, '0'));

  return hexArray.reduce((acc, curr) => acc + curr, '');
}
