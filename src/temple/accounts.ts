import { StoredAccount, TempleAccountType } from 'lib/temple/types';

import { TempleChainName } from './types';

export const getAccountAddressOfTezos = (account: StoredAccount) =>
  getAccountAddressOfChain(account, TempleChainName.Tezos);

// ts-prune-ignore-next
export const getAccountAddressOfEvm = (account: StoredAccount) =>
  getAccountAddressOfChain(account, TempleChainName.EVM);

const getAccountAddressOfChain = (account: StoredAccount, chain: TempleChainName): string | undefined => {
  if (account.type === TempleAccountType.WatchOnly) {
    if (account.chain !== chain) return undefined;
    // TODO: if (storedAccount.chainId && chainId !== storedAccount.chainId) return undefined; ?

    return account.publicKeyHash;
  }

  return chain === 'evm' ? account.evmAddress : account.publicKeyHash;
};
