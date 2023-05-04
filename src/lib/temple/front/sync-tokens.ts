import { useCallback, useState } from 'react';

import constate from 'constate';
import { useSWRConfig } from 'swr';
import { ScopedMutator } from 'swr/dist/types';

import { fetchWhitelistTokenSlugs } from 'lib/apis/temple';
import { TzktAccountToken, fetchTzktTokens } from 'lib/apis/tzkt';
import { toAssetSlug } from 'lib/assets';
import { getPredefinedTokensSlugs } from 'lib/assets/known-tokens';
import { getStoredTokens } from 'lib/temple/assets';
import { useChainId, useAccount } from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';
import { filterUnique } from 'lib/utils';

import { updateTokensSWR } from './assets';

export const [SyncTokensProvider, useSyncTokens] = constate(() => {
  const { mutate } = useSWRConfig();
  const chainId = useChainId(true)!;
  const { publicKeyHash: accountPkh } = useAccount();

  const [isSyncing, setIsSyncing] = useState<boolean | null>(null);

  const syncTokens = useCallback(async () => {
    setIsSyncing(true);

    await makeSync(accountPkh, chainId, mutate);

    setIsSyncing(false);
  }, [accountPkh, chainId, mutate]);

  return { isSyncing, syncTokens };
});

const makeSync = async (accountPkh: string, chainId: string, mutate: ScopedMutator) => {
  if (!chainId) return;

  const [tzktTokens, whitelistTokenSlugs, displayedTokens] = await Promise.all([
    fetchTzktTokens(chainId, accountPkh),
    fetchWhitelistTokenSlugs(chainId),
    getStoredTokens(chainId, accountPkh, true)
  ]);

  const tzktTokensMap = new Map(
    tzktTokens.map(tzktToken => [toAssetSlug(tzktToken.token.contract.address, tzktToken.token.tokenId), tzktToken])
  );

  const displayedTokenSlugs = displayedTokens.map(({ tokenSlug }) => tokenSlug);

  const tokenSlugs = filterUnique([
    ...getPredefinedTokensSlugs(chainId),
    ...tzktTokens.map(balance => toAssetSlug(balance.token.contract.address, balance.token.tokenId)),
    ...displayedTokenSlugs,
    ...whitelistTokenSlugs
  ]);

  const tokensRepoKeys = tokenSlugs.map(slug => Repo.toAccountTokenKey(chainId, accountPkh, slug));

  const existingRecords = await Repo.accountTokens.bulkGet(tokensRepoKeys);

  const repoItems = tokenSlugs.map((slug, i) =>
    updateTokenSlugs(slug, i, chainId, accountPkh, existingRecords, tzktTokensMap)
  );

  const repoKeys = repoItems.map(({ tokenSlug }) => Repo.toAccountTokenKey(chainId, accountPkh, tokenSlug));

  await Repo.accountTokens.bulkPut(repoItems, repoKeys);

  await updateTokensSWR(mutate, chainId, accountPkh);
};

const updateTokenSlugs = (
  slug: string,
  i: number,
  chainId: string,
  accountPkh: string,
  existingRecords: Array<Repo.IAccountToken | undefined>,
  tzktTokensMap: Map<string, TzktAccountToken>
) => {
  const existing = existingRecords[i];
  const tzktToken = tzktTokensMap.get(slug);
  const balance = tzktToken?.balance ?? '0';

  if (existing) {
    return {
      ...existing,
      order: i,
      latestBalance: balance
    };
  }

  const status = getPredefinedTokensSlugs(chainId).includes(slug) ? Repo.ITokenStatus.Enabled : Repo.ITokenStatus.Idle;

  return {
    order: i,
    chainId,
    account: accountPkh,
    tokenSlug: slug,
    status,
    addedAt: Date.now(),
    latestBalance: balance
  };
};
