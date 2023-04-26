import BigNumber from 'bignumber.js';

import * as Repo from 'lib/temple/repo';
import { filterUnique } from 'lib/utils';

export const setTokenStatus = async (
  type: Repo.ITokenType,
  chainId: string,
  account: string,
  tokenSlug: string,
  status: Repo.ITokenStatus
) => {
  const repoKey = Repo.toAccountTokenKey(chainId, account, tokenSlug);
  const existing = await Repo.accountTokens.get(repoKey);

  return Repo.accountTokens.put(
    {
      ...(existing ?? {
        type,
        chainId,
        account,
        tokenSlug,
        addedAt: Date.now()
      }),
      status
    },
    repoKey
  );
};

export const fetchDisplayedFungibleTokens = (chainId: string, account: string) =>
  Repo.accountTokens
    .where({ type: Repo.ITokenType.Fungible, chainId, account })
    .filter(isTokenDisplayed)
    .sortBy('order');

export const fetchFungibleTokens = (chainId: string, account: string) =>
  Repo.accountTokens.where({ type: Repo.ITokenType.Fungible, chainId, account }).toArray();

export const fetchCollectibleTokens = (chainId: string, account: string, onlyDisplayed: boolean = false) => {
  let collection = Repo.accountTokens.where({ type: Repo.ITokenType.Collectible, chainId, account });

  if (onlyDisplayed) {
    collection = collection.filter(accountToken => isTokenDisplayed(accountToken));
  }

  return collection.sortBy('order');
};

export const fetchAllKnownFungibleTokenSlugs = async (chainId: string) => {
  const allAccountTokens = await Repo.accountTokens.where({ type: Repo.ITokenType.Fungible, chainId }).toArray();

  return filterUnique(allAccountTokens.map(t => t.tokenSlug));
};

export const fetchAllKnownCollectibleTokenSlugs = async (chainId: string) => {
  const allAccountTokens = await Repo.accountTokens.where({ type: Repo.ITokenType.Collectible, chainId }).toArray();

  return filterUnique(allAccountTokens.map(t => t.tokenSlug));
};

export const isTokenDisplayed = (t: Repo.IAccountToken) =>
  t.status === Repo.ITokenStatus.Enabled ||
  (t.status === Repo.ITokenStatus.Idle && new BigNumber(t.latestBalance!).isGreaterThan(0));
