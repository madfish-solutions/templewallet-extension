import { stringToUInt8Array } from './buffers';

export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey!);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey!);

  const publicKey = Buffer.from(publicKeyBuffer).toString('hex');
  const privateKey = Buffer.from(privateKeyBuffer).toString('hex');
  const publicKeyHash = await hashPublicKey(publicKey);

  return { publicKey, privateKey, publicKeyHash };
}

function importKey(keyHex: string, isPrivate: boolean) {
  return crypto.subtle.importKey(
    isPrivate ? 'pkcs8' : 'spki',
    Buffer.from(keyHex, 'hex'),
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    isPrivate ? ['sign'] : ['verify']
  );
}

export async function signData(privateKeyHex: string, message: string) {
  const privateKey = await importKey(privateKeyHex, true);
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

async function hashPublicKey(publicKey: string) {
  const publicKeyBytes = stringToUInt8Array(publicKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBytes);

  return Buffer.from(hashBuffer).toString('hex');
}
