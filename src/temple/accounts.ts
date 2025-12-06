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
  hidden?: boolean;
  /** Present for `AccountForChain.type === TempleAccountType.ManagedKT` */
  ownerAddress?: string;
}

export type AccountForTezos = AccountForChain<TempleChainKind.Tezos>;
export type AccountForEvm = AccountForChain<TempleChainKind.EVM>;

export const getAccountForTezos = (account: StoredAccount) => getAccountForChain(account, TempleChainKind.Tezos);
export const getAccountForEvm = (account: StoredAccount) => getAccountForChain(account, TempleChainKind.EVM);

function getAccountForChain<C extends TempleChainKind>(account: StoredAccount, chain: C): AccountForChain<C> | null {
  const { id, type, name, derivationPath, hidden } = account;
  let address: string | undefined, ownerAddress: string | undefined;

  switch (account.type) {
    case TempleAccountType.HD:
      address = account[`${chain}Address`];
      break;
    case TempleAccountType.Imported:
    case TempleAccountType.WatchOnly:
    case TempleAccountType.Ledger:
      if (account.chain === chain) address = account.address;
      break;
    case TempleAccountType.ManagedKT:
      address = account.tezosAddress;
      ownerAddress = account.owner;
      break;
  }

  if (!address) return null;

  return { id, address, chain, type, name, derivationPath, hidden, ownerAddress };
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
    case TempleAccountType.WatchOnly:
    case TempleAccountType.Ledger:
      return account.chain === chain ? account.address : undefined;
    default:
      return account.tezosAddress;
  }
};

export function findAccountForTezos(accounts: StoredAccount[], address: string) {
  for (const account of accounts) {
    const tezosAccount = getAccountForTezos(account);
    if (tezosAccount && tezosAccount.address === address) return tezosAccount;
  }

  return undefined;
}
