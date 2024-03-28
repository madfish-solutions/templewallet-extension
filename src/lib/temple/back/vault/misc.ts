import { InMemorySigner } from '@taquito/signer';
import * as TaquitoUtils from '@taquito/utils';
import * as Bip39 from 'bip39';
import * as Ed25519 from 'ed25519-hd-key';
import * as ViemAccounts from 'viem/accounts';
import { isHex, toHex } from 'viem/utils';

import { ACCOUNT_ALREADY_EXISTS_ERR_MSG } from 'lib/constants';
import { StoredAccount, StoredHDAccount, TempleAccountType } from 'lib/temple/types';
import { TempleChainName } from 'temple/types';

import { PublicError } from '../PublicError';

import { fetchMessage } from './helpers';
import { accPrivKeyStrgKey, accPubKeyStrgKey } from './storage-keys';

const TEZOS_BIP44_COINTYPE = 1729;

export function generateCheck() {
  return Bip39.generateMnemonic(128);
}

export function concatAccount(current: StoredAccount[], newOne: Exclude<StoredAccount, StoredHDAccount>) {
  /** New account is for certain chain */
  const [chain, address] = (() => {
    switch (newOne.type) {
      case TempleAccountType.Imported:
      case TempleAccountType.WatchOnly:
        return [newOne.chain, newOne.address];
      case TempleAccountType.ManagedKT:
      case TempleAccountType.Ledger:
        return [TempleChainName.Tezos, newOne.tezosAddress];
    }

    throw new PublicError('Missing account type');
  })();

  const exists = current.some(acc => {
    switch (acc.type) {
      case TempleAccountType.HD:
        return acc[`${chain}Address`] === address;
      case TempleAccountType.Imported:
      case TempleAccountType.WatchOnly:
        return acc.chain === chain && acc.address === address;
      case TempleAccountType.ManagedKT:
      case TempleAccountType.Ledger:
        return acc.tezosAddress === address;
    }

    throw new PublicError('Missing account type');
  });

  if (exists) throw new PublicError(ACCOUNT_ALREADY_EXISTS_ERR_MSG);

  return [...current, newOne];
}

type NewAccountName = 'defaultAccountName' | 'defaultManagedKTAccountName' | 'defaultWatchOnlyAccountName';

export function fetchNewAccountName(
  allAccounts: StoredAccount[],
  templateI18nKey: NewAccountName = 'defaultAccountName'
) {
  return fetchMessage(templateI18nKey, String(allAccounts.length + 1));
}

interface AccountCreds {
  address: string;
  publicKey: string;
  privateKey: string;
}

export async function mnemonicToTezosAccountCreds(mnemonic: string, hdIndex: number): Promise<AccountCreds> {
  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const privateKey = seedToHDPrivateKey(seed, hdIndex);

  const signer = await createMemorySigner(privateKey);
  const [publicKey, address] = await Promise.all([signer.publicKey(), signer.publicKeyHash()]);

  return { address, publicKey, privateKey };
}

export async function privateKeyToTezosAccountCreds(
  accPrivateKey: string,
  encPassword?: string
): Promise<AccountCreds> {
  const signer = await createMemorySigner(accPrivateKey, encPassword);

  const [realAccPrivateKey, publicKey, address] = await Promise.all([
    signer.secretKey(),
    signer.publicKey(),
    signer.publicKeyHash()
  ]);

  return { address, publicKey, privateKey: realAccPrivateKey };
}

export function mnemonicToEvmAccountCreds(mnemonic: string, hdIndex: number): AccountCreds {
  const ethAcc = ViemAccounts.mnemonicToAccount(mnemonic, { addressIndex: hdIndex });
  const address = ethAcc.address;
  const publicKey = ethAcc.publicKey;
  const privateKey = toHex(ethAcc.getHdKey().privateKey!);

  return { address, publicKey, privateKey };
}

export function privateKeyToEvmAccountCreds(privateKey: string): AccountCreds {
  if (!isHex(privateKey)) throw new Error('EVM private key is not a hex value');
  const { address, publicKey } = ViemAccounts.privateKeyToAccount(privateKey);

  return { address, publicKey, privateKey };
}

export const buildEncryptAndSaveManyForAccount = ({
  address,
  privateKey,
  publicKey
}: AccountCreds): [string, string][] => [
  [accPrivKeyStrgKey(address), privateKey],
  [accPubKeyStrgKey(address), publicKey]
];

export function createMemorySigner(privateKey: string, encPassword?: string) {
  return InMemorySigner.fromSecretKey(privateKey, encPassword);
}

function seedToHDPrivateKey(seed: Buffer, hdAccIndex: number) {
  return seedToPrivateKey(deriveSeed(seed, getMainDerivationPath(hdAccIndex)));
}

export function getMainDerivationPath(accIndex: number) {
  return `m/44'/${TEZOS_BIP44_COINTYPE}'/${accIndex}'/0'`;
}

export function seedToPrivateKey(seed: Buffer) {
  return TaquitoUtils.b58cencode(seed.slice(0, 32), TaquitoUtils.prefix.edsk2);
}

export function deriveSeed(seed: Buffer, derivationPath: string) {
  try {
    const { key } = Ed25519.derivePath(derivationPath, seed.toString('hex'));
    return key;
  } catch (_err) {
    throw new PublicError('Invalid derivation path');
  }
}

export async function withError<T>(errMessage: string, factory: (doThrow: () => void) => Promise<T>) {
  try {
    return await factory(() => {
      throw new Error('<stub>');
    });
  } catch (err: any) {
    console.error(err);
    throw err instanceof PublicError ? err : new PublicError(errMessage);
  }
}
