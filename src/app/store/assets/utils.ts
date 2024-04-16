export const getAccountAssetsStoreKey = (account: string, chainId: string) => `${account}@${chainId}`;

export const isAccountAssetsStoreKeyOfSameChainIdAndDifferentAccount = (
  key: string,
  account: string,
  chainId: string
) => !key.startsWith(account) && key.endsWith(chainId);
