import BigNumber from 'bignumber.js';

import * as Repo from 'lib/temple/repo';

export async function setTokenStatus(
  type: Repo.ITokenType,
  chainId: string,
  account: string,
  tokenSlug: string,
  status: Repo.ITokenStatus
) {
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
}

export async function fetchDisplayedFungibleTokens(chainId: string, account: string) {
  return Repo.accountTokens
    .where({ type: Repo.ITokenType.Fungible, chainId, account })
    .filter(isTokenDisplayed)
    .sortBy('order')
    .then(items => items);
}

export async function fetchFungibleTokens(chainId: string, account: string) {
  return Repo.accountTokens.where({ type: Repo.ITokenType.Fungible, chainId, account }).toArray();
}

export async function fetchCollectibleTokens(chainId: string, account: string, isDisplayed: boolean) {
  return Repo.accountTokens
    .where({ type: Repo.ITokenType.Collectible, chainId, account })
    .filter(accountToken => (isDisplayed ? isTokenDisplayed(accountToken) : true))
    .sortBy('order');
}

export async function fetchAllKnownFungibleTokenSlugs(chainId: string) {
  const allAccountTokens = await Repo.accountTokens.where({ type: Repo.ITokenType.Fungible, chainId }).toArray();

  return Array.from(new Set(allAccountTokens.map(t => t.tokenSlug)));
}

export async function fetchAllKnownCollectibleTokenSlugs(chainId: string) {
  const allAccountTokens = await Repo.accountTokens.where({ type: Repo.ITokenType.Collectible, chainId }).toArray();

  return Array.from(new Set(allAccountTokens.map(t => t.tokenSlug)));
}

export function isTokenDisplayed(t: Repo.IAccountToken) {
  return (
    t.status === Repo.ITokenStatus.Enabled ||
    (t.status === Repo.ITokenStatus.Idle && new BigNumber(t.latestBalance!).isGreaterThan(0))
  );
}
