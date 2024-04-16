import { StoredAccount, TempleAccountType, StoredAccountBase } from 'lib/temple/types';

import { TempleChainKind } from './types';

export const isAccountOfActableType = (account: StoredAccountBase) =>
  !(account.type === TempleAccountType.WatchOnly || account.type === TempleAccountType.ManagedKT);

export interface AccountForChain<C extends TempleChainKind = TempleChainKind> {
  id: string;
  chain: C;
  address: string;
  type: TempleAccountType;
  name: string;
  /** Present for `AccountForChain.type === TempleAccountType.Ledger` */
  derivationPath?: string;
  /** Present for `AccountForChain.type === TempleAccountType.ManagedKT` */
  ownerAddress?: string;
}

export type AccountForTezos = AccountForChain<TempleChainKind.Tezos>;

export const getAccountForTezos = (account: StoredAccount) => getAccountForChain(account, TempleChainKind.Tezos);
export const getAccountForEvm = (account: StoredAccount) => getAccountForChain(account, TempleChainKind.EVM);

function getAccountForChain<C extends TempleChainKind>(account: StoredAccount, chain: C): AccountForChain<C> | null {
  const { id, type, name, derivationPath } = account;
  let address: string | undefined, ownerAddress: string | undefined;

  switch (account.type) {
    case TempleAccountType.HD:
      address = account[`${chain}Address`];
      break;
    case TempleAccountType.Imported:
      if (account.chain === chain) address = account.address;
      break;
    case TempleAccountType.WatchOnly:
      if (account.chain === chain) address = account.address;
      break;
    case TempleAccountType.ManagedKT:
      address = account.tezosAddress;
      ownerAddress = account.owner;
      break;
    default:
      if (chain === 'tezos') address = account.tezosAddress;
  }

  if (!address) return null;

  return { id, address, chain, type, name, derivationPath, ownerAddress };
}

export const getAccountAddressForTezos = (account: StoredAccount) =>
  getAccountAddressForChain(account, TempleChainKind.Tezos);

export const getAccountAddressForEvm = (account: StoredAccount) =>
  getAccountAddressForChain(account, TempleChainKind.EVM) as HexString | undefined;

export const getAccountAddressForChain = (account: StoredAccount, chain: TempleChainKind): string | undefined => {
  switch (account.type) {
    case TempleAccountType.HD:
      return account[`${chain}Address`];
    case TempleAccountType.Imported:
      return account.chain === chain ? account.address : undefined;
    case TempleAccountType.WatchOnly:
      return account.chain === chain ? account.address : undefined;
  }

  return account.tezosAddress;
};

export function findAccountForTezos(accounts: StoredAccount[], address: string) {
  for (const account of accounts) {
    const tezosAccount = getAccountForTezos(account);
    if (tezosAccount && tezosAccount.address === address) return tezosAccount;
  }

  return undefined;
}
