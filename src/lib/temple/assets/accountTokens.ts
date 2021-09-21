import BigNumber from "bignumber.js";

import * as Repo from "lib/temple/repo";

import { PREDEFINED_MAINNET_TOKENS } from "./predefinedTokens";

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
        addedAt: Date.now(),
      }),
      status,
    },
    repoKey
  );
}

export async function fetchDisplayedFungibleTokens(
  chainId: string,
  account: string
) {
  return Repo.accountTokens
    .where({ type: Repo.ITokenType.Fungible, chainId, account })
    .filter(isFungibleTokenDisplayed)
    .reverse()
    .sortBy("addedAt")
    .then((items) => items.sort(compareAccountTokensByUSDBalance));
}

export async function fetchFungibleTokens(chainId: string, account: string) {
  return Repo.accountTokens
    .where({ type: Repo.ITokenType.Fungible, chainId, account })
    .toArray();
}

export async function fetchCollectibleTokens(chainId: string, account: string) {
  return Repo.accountTokens
    .where({ type: Repo.ITokenType.Collectible, chainId, account })
    .reverse()
    .sortBy("addedAt");
}

export async function fetchAllKnownFungibleTokenSlugs(chainId: string) {
  const allAccountTokens = await Repo.accountTokens
    .where({ type: Repo.ITokenType.Fungible, chainId })
    .toArray();

  return Array.from(new Set(allAccountTokens.map((t) => t.tokenSlug)));
}

export async function fetchAllKnownCollectibleTokenSlugs(chainId: string) {
  const allAccountTokens = await Repo.accountTokens
    .where({ type: Repo.ITokenType.Collectible, chainId })
    .toArray();

  return Array.from(new Set(allAccountTokens.map((t) => t.tokenSlug)));
}

export function isFungibleTokenDisplayed(t: Repo.IAccountToken) {
  return (
    t.status === Repo.ITokenStatus.Enabled ||
    (t.status === Repo.ITokenStatus.Idle &&
      new BigNumber(t.latestBalance!).isGreaterThan(0))
  );
}

export function compareAccountTokensByUSDBalance(
  a: Repo.IAccountToken,
  b: Repo.IAccountToken
): number {
  if (!a.latestUSDBalance) return 1;
  if (!b.latestUSDBalance) return -1;

  const aUSDBal = new BigNumber(a.latestUSDBalance);
  const bUSDBal = new BigNumber(b.latestUSDBalance);

  const aPredefIndex = PREDEFINED_MAINNET_TOKENS.findIndex(
    (slug) => slug === a.tokenSlug
  );
  const bPredefIndex = PREDEFINED_MAINNET_TOKENS.findIndex(
    (slug) => slug === b.tokenSlug
  );

  if (aUSDBal.isEqualTo(bUSDBal)) return aPredefIndex > bPredefIndex ? 1 : -1;

  return aUSDBal.isLessThan(bUSDBal) ? 1 : -1;
}
