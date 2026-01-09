import { isDefined } from '@rnw-community/shared';
import { InMemorySigner } from '@taquito/signer';
import { PrefixV2, b58Encode } from '@taquito/utils';
import * as Bip39 from 'bip39';
import * as Ed25519 from 'ed25519-hd-key';
import * as ViemAccounts from 'viem/accounts';
import { isHex, toHex } from 'viem/utils';

import { TempleChainKind } from 'temple/types';

export interface AccountCreds {
  address: string;
  publicKey: string;
  privateKey: string;
}

export function createMemorySigner(privateKey: string, encPassword?: string) {
  return InMemorySigner.fromSecretKey(privateKey, encPassword);
}

export async function privateKeyToTezosAccountCreds(
  accPrivateKey: string,
  encPassword?: string
): Promise<AccountCreds> {
  const signer = await createMemorySigner(accPrivateKey, encPassword);

  const [realAccPrivateKey, publicKey, address] = await Promise.all([
    isDefined(encPassword) ? signer.secretKey() : Promise.resolve(accPrivateKey),
    signer.publicKey(),
    signer.publicKeyHash()
  ]);

  return { address, publicKey, privateKey: realAccPrivateKey };
}

export function seedToPrivateKey(seed: Buffer, chain: TempleChainKind) {
  return chain === TempleChainKind.Tezos ? b58Encode(seed.slice(0, 32), PrefixV2.Ed25519Seed) : toHex(seed);
}

export function isEvmDerivationPath(derivationPath: string): derivationPath is `m/44'/60'/${string}` {
  return derivationPath.startsWith("m/44'/60'");
}

export function deriveSeed(seed: Buffer, derivationPath: string, errorFactory: (msg: string) => Error) {
  try {
    if (isEvmDerivationPath(derivationPath)) {
      const account = ViemAccounts.hdKeyToAccount(ViemAccounts.HDKey.fromMasterSeed(new Uint8Array(seed)), {
        path: derivationPath
      });

      return Buffer.from(account.getHdKey().privateKey!);
    }

    return Ed25519.derivePath(derivationPath, seed.toString('hex')).key;
  } catch (err) {
    console.error(err);
    throw errorFactory('Invalid derivation path');
  }
}

export function mnemonicToPrivateKey(
  mnemonic: string,
  errorFactory: (msg: string) => Error,
  password?: string,
  derivationPath?: string
) {
  let seed;
  try {
    seed = Bip39.mnemonicToSeedSync(mnemonic, password);
  } catch {
    throw errorFactory('Invalid Mnemonic or Password');
  }

  if (derivationPath) {
    seed = deriveSeed(seed, derivationPath, errorFactory);
  }

  // TODO: Loose chain from derivation, when importing accounts is reworked
  const chain = derivationPath && isEvmDerivationPath(derivationPath) ? TempleChainKind.EVM : TempleChainKind.Tezos;
  const privateKey = seedToPrivateKey(seed, chain);

  return { chain, privateKey };
}

export function mnemonicToLegacyPrivateKey(mnemonic: string) {
  let seed;
  try {
    seed = Bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);
  } catch {
    throw new Error('Invalid Mnemonic or Password');
  }

  return { chain: TempleChainKind.Tezos, privateKey: seedToPrivateKey(seed, TempleChainKind.Tezos) };
}

export function privateKeyToEvmAccountCreds(privateKey: string): AccountCreds {
  if (!isHex(privateKey)) throw new Error('EVM private key is not a hex value');
  const { address, publicKey } = ViemAccounts.privateKeyToAccount(privateKey);

  return { address, publicKey, privateKey };
}
