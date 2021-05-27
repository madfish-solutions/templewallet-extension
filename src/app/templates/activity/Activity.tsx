import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";

import { ACTIVITY_PAGE_SIZE } from "app/defaults";
import { useRetryableSWR } from "lib/swr";
import {
  useChainId,
  fetchOperations,
  syncOperations,
  isSyncSupported,
} from "lib/temple/front";
import { IOperation } from "lib/temple/repo";
import useSafeState from "lib/ui/useSafeState";

import ActivityView from "./ActivityView";

type ActivityProps = {
  address: string;
  assetId?: string;
  className?: string;
};

const Activity = memo<ActivityProps>(({ address, assetId, className }) => {
  const chainId = useChainId(true)!;
  const syncSupported = useMemo(() => isSyncSupported(chainId), [chainId]);

  const safeStateKey = useMemo(() => [chainId, address, assetId].join("_"), [
    chainId,
    address,
    assetId,
  ]);

  const [restOperations, setRestOperations] = useSafeState<IOperation[]>(
    [],
    safeStateKey
  );
  const [syncing, setSyncing] = useSafeState(false, safeStateKey);
  const [loadingMore, setLoadingMore] = useSafeState(false, safeStateKey);
  const [, setSyncError] = useSafeState<Error | null>(null, safeStateKey);

  const {
    data: latestOperations,
    isValidating: fetching,
    revalidate: refetchLatest,
  } = useRetryableSWR(
    ["latest-operations", chainId, address, assetId],
    () =>
      fetchOperations({
        chainId,
        address,
        assetIds: assetId ? [assetId] : undefined,
        limit: ACTIVITY_PAGE_SIZE,
      }),
    {
      revalidateOnMount: true,
      refreshInterval: 10_000,
      dedupingInterval: 3_000,
    }
  );

  const operations = useMemo(
    () => mergeOperations(latestOperations, restOperations),
    [latestOperations, restOperations]
  );

  /**
   * Load more / Pagination
   */

  const hasMoreRef = useRef(true);
  useLayoutEffect(() => {
    hasMoreRef.current = true;
  }, [safeStateKey]);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);

    try {
      await syncOperations("old", chainId, address);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      setSyncError(err);
    }

    try {
      const oldOperations = await fetchOperations({
        chainId,
        address,
        assetIds: assetId ? [assetId] : undefined,
        limit: ACTIVITY_PAGE_SIZE,
        offset: operations?.length ?? 0,
      });
      if (oldOperations.length === 0) {
        hasMoreRef.current = false;
      }

      setRestOperations((ops) => [...ops, ...oldOperations]);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    }

    setLoadingMore(false);
  }, [
    setLoadingMore,
    setSyncError,
    setRestOperations,
    chainId,
    address,
    assetId,
    operations,
  ]);

  /**
   * New operations syncing
   */

  const syncNewOperations = useCallback(async () => {
    setSyncing(true);
    try {
      const newCount = await syncOperations("new", chainId, address);
      if (newCount > 0) {
        refetchLatest();
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      setSyncError(err);
    }
    setSyncing(false);
  }, [setSyncing, setSyncError, chainId, address, refetchLatest]);

  const timeoutRef = useRef<any>();

  const syncAndDefer = useCallback(async () => {
    await syncNewOperations();
    timeoutRef.current = setTimeout(syncAndDefer, 10_000);
  }, [syncNewOperations]);

  useEffect(() => {
    if (syncSupported) {
      syncAndDefer();
    }

    return () => clearTimeout(timeoutRef.current);
  }, [syncSupported, syncAndDefer]);

  return (
    <ActivityView
      address={address}
      syncSupported={syncSupported}
      operations={operations ?? []}
      initialLoading={
        fetching || (!operations || operations.length === 0 ? syncing : false)
      }
      loadingMore={loadingMore}
      syncing={syncing}
      loadMoreDisplayed={hasMoreRef.current}
      loadMore={handleLoadMore}
      className={className}
    />
  );
});

export default Activity;

function mergeOperations(base?: IOperation[], toAppend: IOperation[] = []) {
  if (!base) return undefined;

  const uniqueHashes = new Set<string>();
  const uniques: IOperation[] = [];
  for (const op of [...base, ...toAppend]) {
    if (!uniqueHashes.has(op.hash)) {
      uniqueHashes.add(op.hash);
      uniques.push(op);
    }
  }
  return uniques;
}
