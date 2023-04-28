import { useCallback, useState } from 'react';

import constate from 'constate';
import { useSWRConfig } from 'swr';
import { ScopedMutator } from 'swr/dist/types';

import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { fetchWhitelistTokenSlugs } from 'lib/apis/temple';
import { TzktAccountToken, fetchTzktTokens } from 'lib/apis/tzkt';
import { METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { TokenMetadata } from 'lib/metadata';
import {
  toAssetSlug,
  fetchDisplayedFungibleTokens,
  fetchCollectibleTokens,
  getPredefinedTokensSlugs
} from 'lib/temple/assets';
import { useChainId, useAccount } from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';
import { useInterval } from 'lib/ui/hooks';
import { filterUnique, isTruthy } from 'lib/utils';

export const [SyncTokensProvider, useSyncTokens] = constate(() => {
  const { mutate } = useSWRConfig();
  const chainId = useChainId(true)!;
  const { publicKeyHash: accountPkh } = useAccount();

  const tokensMetadata = useTokensMetadataSelector();

  const [isSyncing, setIsSyncing] = useState<boolean | null>(null);

  const sync = useCallback(async () => {
    setIsSyncing(true);

    await makeSync(accountPkh, chainId, tokensMetadata, mutate);

    setIsSyncing(false);
  }, [accountPkh, chainId, tokensMetadata, mutate]);

  useInterval(sync, METADATA_SYNC_INTERVAL, [chainId, accountPkh]);

  return isSyncing;
});

const makeSync = async (
  accountPkh: string,
  chainId: string,
  tokensMetadata: Record<string, TokenMetadata>,
  mutate: ScopedMutator
) => {
  if (!chainId) return;

  const [tzktTokens, displayedFungibleTokens, displayedCollectibleTokens, whitelistTokenSlugs] = await Promise.all([
    fetchTzktTokens(chainId, accountPkh),
    fetchDisplayedFungibleTokens(chainId, accountPkh),
    fetchCollectibleTokens(chainId, accountPkh, true),
    fetchWhitelistTokenSlugs(chainId)
  ]);

  const tzktTokensMap = new Map(
    tzktTokens.map(tzktToken => [toAssetSlug(tzktToken.token.contract.address, tzktToken.token.tokenId), tzktToken])
  );

  const displayedTokenSlugs = [...displayedFungibleTokens, ...displayedCollectibleTokens].map(
    ({ tokenSlug }) => tokenSlug
  );

  const tokenSlugs = filterUnique([
    ...getPredefinedTokensSlugs(chainId),
    ...tzktTokens.map(balance => toAssetSlug(balance.token.contract.address, balance.token.tokenId)),
    ...displayedTokenSlugs,
    ...whitelistTokenSlugs
  ]);

  const tokenRepoKeys = tokenSlugs.map(slug => Repo.toAccountTokenKey(chainId, accountPkh, slug));

  const existingRecords = await Repo.accountTokens.bulkGet(tokenRepoKeys);

  await Repo.accountTokens.bulkPut(
    tokenSlugs
      .map((slug, i) => updateTokenSlugs(slug, i, chainId, accountPkh, existingRecords, tzktTokensMap, tokensMetadata))
      .filter(isTruthy),
    tokenRepoKeys
  );

  await mutate(['displayed-fungible-tokens', chainId, accountPkh]);
};

const updateTokenSlugs = (
  slug: string,
  i: number,
  chainId: string,
  accountPkh: string,
  existingRecords: Array<Repo.IAccountToken | undefined>,
  tzktTokensMap: Map<string, TzktAccountToken>,
  tokensMetadata: Record<string, TokenMetadata>
) => {
  const existing = existingRecords[i];
  const tzktToken = tzktTokensMap.get(slug);
  const balance = tzktToken?.balance ?? '0';
  const metadata = (tokensMetadata[slug] as TokenMetadata | undefined) || tzktToken?.token.metadata;

  if (!metadata) return;

  const tokenType = metadata.artifactUri ? Repo.ITokenType.Collectible : Repo.ITokenType.Fungible;

  if (existing) {
    return {
      ...existing,
      type: tokenType,
      order: i,
      latestBalance: balance
    };
  }

  const status = getPredefinedTokensSlugs(chainId).includes(slug) ? Repo.ITokenStatus.Enabled : Repo.ITokenStatus.Idle;

  return {
    type: tokenType,
    order: i,
    chainId,
    account: accountPkh,
    tokenSlug: slug,
    status,
    addedAt: Date.now(),
    latestBalance: balance
  };
};
