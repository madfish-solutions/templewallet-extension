import * as Repo from "lib/temple/repo";

export type FetchOperationsParams = {
  chainId: string;
  address: string;
  assetIds?: string[];
  offset?: number;
  limit?: number;
};

export async function fetchOperations({
  chainId,
  address,
  assetIds,
  offset,
  limit,
}: FetchOperationsParams) {
  // Base
  let query = Repo.operations
    .where("[chainId+addedAt]")
    .between([chainId, 0], [chainId, Date.now()])
    .reverse();

  // Filter by members & assets
  query = query.filter(
    (o) =>
      o.members.includes(address) &&
      (assetIds ? o.assetIds.some((aId) => assetIds.includes(aId)) : true)
  );

  // Sorting
  if (offset) {
    query = query.offset(offset);
  }
  if (limit) {
    query = query.limit(limit);
  }

  return query.toArray();
}
