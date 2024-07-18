import { ui8aToHex } from './buffers';

export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey!);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey!);

  const publicKey = JSON.stringify(publicKeyJwk);
  const privateKey = JSON.stringify(privateKeyJwk);
  const publicKeyHash = await hashPublicKey(publicKey);

  console.log('KEY:', 0, publicKeyHash);

  return { publicKey, privateKey, publicKeyHash };
}

function importKey(jwk: string, isPrivate: boolean) {
  return crypto.subtle.importKey(
    'jwk',
    JSON.parse(jwk),
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    isPrivate ? ['sign'] : ['verify']
  );
}

export async function signData(privateKeyJwk: string, message: string) {
  const privateKey = await importKey(privateKeyJwk, true);
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);

  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' }
    },
    privateKey,
    messageBytes
  );

  return Buffer.from(signature).toString('base64');
}

async function hashPublicKey(publicKeyJwk: string) {
  const encoder = new TextEncoder();
  const publicKeyBytes = encoder.encode(publicKeyJwk);
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBytes);

  return ui8aToHex(new Uint8Array(hashBuffer));
}
