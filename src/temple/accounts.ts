import { StoredAccount, TempleAccountType } from 'lib/temple/types';

import { TempleChainName } from './types';

export interface AccountForChain<C extends TempleChainName = TempleChainName> {
  // TODO: extends StoredAccountBase ?
  id: string;
  chain: C;
  address: string;
  type: TempleAccountType;
  name: string;
  derivationPath?: string;
}

export type AccountForTezos = AccountForChain<TempleChainName.Tezos>;

export const getAccountForTezos = (account: StoredAccount) => getAccountForChain(account, TempleChainName.Tezos);

export function getAccountForChain<C extends TempleChainName>(
  account: StoredAccount,
  chain: C
): AccountForChain<C> | null {
  const { id, type, name, derivationPath } = account;
  let address: string | undefined;

  switch (account.type) {
    case TempleAccountType.HD:
      address = account[`${chain}Address`];
      break;
    case TempleAccountType.Imported:
      if (account.chain === chain) address = account.address;
      break;
    case TempleAccountType.WatchOnly:
      // TODO: if (account.chainId && chainId !== account.chainId) return undefined; ?
      if (account.chain === chain) address = account.address;
      break;
    default:
      if (chain === 'tezos') address = account.tezosAddress;
  }

  if (!address) return null;

  return { id, address, chain, type, name, derivationPath };
}

export const getAccountAddressForTezos = (account: StoredAccount) =>
  getAccountAddressForChain(account, TempleChainName.Tezos);

export const getAccountAddressForEvm = (account: StoredAccount) =>
  getAccountAddressForChain(account, TempleChainName.EVM) as HexString | undefined;

export const getAccountAddressForChain = (account: StoredAccount, chain: TempleChainName): string | undefined => {
  switch (account.type) {
    case TempleAccountType.HD:
      return chain === 'evm' ? account.evmAddress : account.tezosAddress;
    case TempleAccountType.Imported:
      return account.chain === chain ? account.address : undefined;
    case TempleAccountType.WatchOnly:
      // TODO: if (account.chainId && chainId !== account.chainId) return undefined; ?
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

// ts-prune-ignore-next
export const getAccountAddressesRecord = (account: StoredAccount): Record<TempleChainName, string | undefined> => ({
  [TempleChainName.Tezos]: getAccountAddressForTezos(account),
  [TempleChainName.EVM]: getAccountAddressForEvm(account)
});
