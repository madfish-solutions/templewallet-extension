import { entropyToMnemonic } from 'bip39';
import * as forge from 'node-forge';
import scrypt from 'scryptsy';

import { t } from 'lib/i18n/react';

async function decrypt(chipher: string, password: string, salt: string) {
  try {
    if (!password || !salt) {
      throw new Error('Missing password or salt');
    }
    const parts = chipher.split('==');
    const chiphertext = parts[0];
    const tag = parts[1];
    const key = await scrypt.async(password, Buffer.from(salt, 'hex'), 65536, 8, 1, 32);
    const decipher = forge.cipher.createDecipher('AES-GCM', key.toString('binary'));
    decipher.start({
      iv: Buffer.from(salt, 'hex'),
      tag: forge.util.createBuffer(Buffer.from(tag, 'hex').toString('binary'), 'utf-8')
    });
    decipher.update(forge.util.createBuffer(Buffer.from(chiphertext, 'hex').toString('binary'), 'utf-8'));
    const pass = decipher.finish();
    if (pass) {
      return Buffer.from(decipher.output.toHex(), 'hex');
    } else {
      return null;
    }
  } catch (err: any) {
    return null;
  }
}

function bumpIV(salt: string) {
  const buf = Buffer.from(salt, 'hex');
  buf[13] = (buf[13] + 1) % 256;

  return buf.toString('hex');
}

export async function decryptKukaiSeedPhrase(json: string, pwd: string) {
  const walletData = JSON.parse(json);
  if (walletData.version === 3 && (walletData.walletType === 4 || walletData.walletType === 0)) {
    const iv = bumpIV(walletData.iv);
    const entropy = await decrypt(walletData.encryptedEntropy, pwd, iv);
    if (!entropy) {
      throw new Error(t('entropyDecryptionError'));
    }

    return entropyToMnemonic(entropy);
  }
  if (walletData.version !== 3) {
    throw new Error(t('kukaiFileVersionError'));
  }
  throw new Error(t('kukaiWalletTypeError'));
}
