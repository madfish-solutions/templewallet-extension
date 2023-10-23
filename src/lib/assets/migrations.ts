import { dispatch } from 'app/store';
import { putAssetsAsIsAction } from 'app/store/assets/actions';
import type { StoredToken, StoredCollectible } from 'app/store/assets/state';
import { isCollectible, TokenMetadata } from 'lib/metadata';
import * as Repo from 'lib/temple/repo';

export const migrateFromIndexedDB = async (metadatas: Record<string, TokenMetadata>) => {
  const allRecords = await Repo.accountTokens.toArray();

  const collectibles: StoredCollectible[] = [];
  const tokens: StoredToken[] = [];

  const statusMap = {
    [Repo.ITokenStatus.Enabled]: 'enabled',
    [Repo.ITokenStatus.Disabled]: 'disabled',
    [Repo.ITokenStatus.Removed]: 'removed',
    [Repo.ITokenStatus.Idle]: undefined
  } as const;

  for (const { tokenSlug, account, chainId, status } of allRecords) {
    const metadata = metadatas[tokenSlug];
    if (!metadata) continue;

    if (isCollectible(metadata))
      collectibles.push({
        slug: tokenSlug,
        account,
        chainId,
        status: statusMap[status],
        name: metadata.name,
        symbol: metadata.symbol
      });
    else
      tokens.push({
        slug: tokenSlug,
        account,
        chainId,
        status: statusMap[status]
      });
  }

  if (tokens.length) dispatch(putAssetsAsIsAction({ type: 'tokens', assets: tokens }));
  if (collectibles.length) dispatch(putAssetsAsIsAction({ type: 'collectibles', assets: collectibles }));

  await Repo.accountTokens.clear();
};
