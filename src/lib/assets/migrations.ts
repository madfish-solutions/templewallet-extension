import { dispatch } from 'app/store';
import { TokenToPut, CollectibleToPut, putTokensAsIsAction, putCollectiblesAsIsAction } from 'app/store/assets/actions';
import { isCollectible, TokenMetadata } from 'lib/metadata';
import * as Repo from 'lib/temple/repo';

export const migrateFromIndexedDB = async (metadatas: Record<string, TokenMetadata>) => {
  const allRecords = await Repo.accountTokens.toArray();

  const collectibles: CollectibleToPut[] = [];
  const tokens: TokenToPut[] = [];

  const statusMap = {
    [Repo.ITokenStatus.Enabled]: 'enabled',
    [Repo.ITokenStatus.Disabled]: 'disabled',
    [Repo.ITokenStatus.Removed]: 'removed',
    [Repo.ITokenStatus.Idle]: 'idle'
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
        // Specifying all as manually added, as this information is lost at this point.
        manual: true
      });
    else
      tokens.push({
        slug: tokenSlug,
        account,
        chainId,
        status: statusMap[status]
      });
  }

  if (tokens.length) dispatch(putTokensAsIsAction(tokens));
  if (collectibles.length) dispatch(putCollectiblesAsIsAction(collectibles));

  await Repo.accountTokens.clear();
};
