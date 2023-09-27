import { dispatch } from 'app/store';
import { putAssetAsIsAction } from 'app/store/assets/actions';
import type { StoredAsset } from 'app/store/assets/state';
import { isCollectible, TokenMetadata } from 'lib/metadata';
import * as Repo from 'lib/temple/repo';

export const migrateFromIndexedDB = async (metadatas: Record<string, TokenMetadata>) => {
  const allRecords = await Repo.accountTokens.toArray();

  const collectibles: StoredAsset[] = [];
  const tokens: StoredAsset[] = [];

  const statusMap = {
    [Repo.ITokenStatus.Enabled]: 'enabled',
    [Repo.ITokenStatus.Disabled]: 'disabled',
    [Repo.ITokenStatus.Removed]: 'removed',
    [Repo.ITokenStatus.Idle]: undefined
  } as const;

  for (const { tokenSlug, account, chainId, status } of allRecords) {
    const metadata = metadatas[tokenSlug];
    if (!metadata) continue;

    (isCollectible(metadata) ? collectibles : tokens).push({
      slug: tokenSlug,
      account,
      chainId,
      status: statusMap[status]
    });
  }

  if (tokens.length) dispatch(putAssetAsIsAction({ type: 'tokens', assets: tokens }));
  if (collectibles.length) dispatch(putAssetAsIsAction({ type: 'collectibles', assets: collectibles }));

  await Repo.accountTokens.clear();
};
