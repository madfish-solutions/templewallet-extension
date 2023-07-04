import BigNumber from 'bignumber.js';

import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import * as Repo from 'lib/temple/repo';
import { filterUnique } from 'lib/utils';

export const setTokenStatus = async (
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

export const getStoredTokens = (chainId: string, account: string, onlyDisplayed: boolean = false) => {
  let collection = Repo.accountTokens.where({ chainId, account });

  if (onlyDisplayed) {
    collection = collection.filter(accountToken => isTokenDisplayed(accountToken));
  }

  return collection.sortBy('order');
};

export const getAllStoredTokensSlugs = async (chainId: string) => {
  const allAccountTokens = await Repo.accountTokens.where({ chainId }).toArray();

  return filterUnique(allAccountTokens.map(t => t.tokenSlug));
};

export const isTokenDisplayed = (t: Repo.IAccountToken) =>
  t.status === Repo.ITokenStatus.Enabled ||
  (t.status === Repo.ITokenStatus.Idle && new BigNumber(t.latestBalance!).isGreaterThan(0)) ||
  t.tokenSlug === TEMPLE_TOKEN_SLUG;
