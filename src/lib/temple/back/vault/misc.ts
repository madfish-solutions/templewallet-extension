import { InMemorySigner } from '@taquito/signer';
import * as TaquitoUtils from '@taquito/utils';
import * as Bip39 from 'bip39';
import * as Ed25519 from 'ed25519-hd-key';
import * as ViemAccounts from 'viem/accounts';
import { isHex, toHex } from 'viem/utils';

import { ACCOUNT_ALREADY_EXISTS_ERR_MSG } from 'lib/constants';
import { fetchNewAccountName as genericFetchNewAccountName, getDerivationPath } from 'lib/temple/helpers';
import { StoredAccount, TempleAccountType } from 'lib/temple/types';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { TempleChainName } from 'temple/types';

import { PublicError } from '../PublicError';

import { fetchMessage } from './helpers';
import { accPrivKeyStrgKey, accPubKeyStrgKey } from './storage-keys';

export function generateCheck() {
  return Bip39.generateMnemonic(128);
}

export function concatAccount(current: StoredAccount[], newOne: StoredAccount) {
  if (newOne.type === TempleAccountType.HD) {
    if (current.some(acc => acc.type === TempleAccountType.HD && acc.tezosAddress === newOne.tezosAddress)) {
      throw new PublicError(ACCOUNT_ALREADY_EXISTS_ERR_MSG);
    }

    return [
      ...current.filter(account => {
        if (account.type === TempleAccountType.HD) {
          return true;
        }

        const chain = 'chain' in account ? account.chain : TempleChainName.Tezos;

        return chain === TempleChainName.Tezos
          ? getAccountAddressForTezos(account) !== newOne.tezosAddress
          : getAccountAddressForEvm(account) !== newOne.evmAddress;
      }),
      newOne
    ];
  }

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

export async function fetchNewAccountName(
  allAccounts: StoredAccount[],
  newAccountType: TempleAccountType,
  newAccountGroupId?: string,
  templateI18nKey: NewAccountName = 'defaultAccountName'
) {
  return genericFetchNewAccountName(
    allAccounts,
    newAccountType,
    i => fetchMessage(templateI18nKey, String(i)),
    newAccountGroupId
  );
}

export function canRemoveAccounts(allAccounts: StoredAccount[], accountsToRemove: StoredAccount[]) {
  const allHdAccounts = allAccounts.filter(acc => acc.type === TempleAccountType.HD);
  const hdAccountsToRemove = accountsToRemove.filter(acc => acc.type === TempleAccountType.HD);

  return allHdAccounts.length - hdAccountsToRemove.length >= 1;
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
  return seedToPrivateKey(deriveSeed(seed, getDerivationPath(TempleChainName.Tezos, hdAccIndex)));
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
    throw err.name === 'PublicError' ? err : new PublicError(errMessage);
  }
}
