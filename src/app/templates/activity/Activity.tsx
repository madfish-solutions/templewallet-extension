import React, { memo, useCallback, useEffect, useMemo, useRef, useLayoutEffect } from 'react';

import { ACTIVITY_PAGE_SIZE } from 'app/defaults';
import { useRetryableSWR } from 'lib/swr';
import { useChainId, fetchOperations, syncOperations, isSyncSupported } from 'lib/temple/front';
import { IOperation } from 'lib/temple/repo';
import useSafeState from 'lib/ui/useSafeState';

import ActivityView from './ActivityView';

type ActivityProps = {
  address: string;
  assetSlug?: string;
  className?: string;
};

const Activity = memo<ActivityProps>(({ address, assetSlug, className }) => {
  const chainId = useChainId(true)!;
  const syncSupported = useMemo(() => isSyncSupported(chainId), [chainId]);

  const safeStateKey = useMemo(() => [chainId, address, assetSlug].join('_'), [chainId, address, assetSlug]);

  const [restOperations, setRestOperations] = useSafeState<IOperation[]>([], safeStateKey);
  const [syncing, setSyncing] = useSafeState(false, safeStateKey);
  const [loadingMore, setLoadingMore] = useSafeState(false, safeStateKey);
  const [, setSyncError] = useSafeState<Error | null>(null, safeStateKey);

  const {
    data: latestOperations,
    isValidating: fetching,
    revalidate: refetchLatest
  } = useRetryableSWR(
    ['latest-operations', chainId, address, assetSlug],
    () =>
      fetchOperations({
        chainId,
        address,
        assetIds: assetSlug ? [assetSlug] : undefined,
        limit: ACTIVITY_PAGE_SIZE
      }),
    {
      revalidateOnMount: true,
      refreshInterval: 10_000,
      dedupingInterval: 3_000
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

  const handleLoadMoreInner = useCallback(async () => {
    handleLoadMore({
      setLoadingMore,
      setSyncError,
      setRestOperations,
      chainId,
      address,
      assetSlug,
      operations,
      hasMoreRef
    });
  }, [setLoadingMore, setSyncError, setRestOperations, chainId, address, assetSlug, operations]);

  /**
   * New operations syncing
   */

  const syncNewOperations = useCallback(async () => {
    setSyncing(true);
    try {
      const newCount = await syncOperations('new', chainId, address);
      if (newCount > 0) {
        refetchLatest();
      }
    } catch (err: any) {
      console.error(err);
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
      initialLoading={fetching || (!operations || operations.length === 0 ? syncing : false)}
      loadingMore={loadingMore}
      syncing={syncing}
      loadMoreDisplayed={hasMoreRef.current}
      loadMore={handleLoadMoreInner}
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

interface IHandlerLoadMore {
  setLoadingMore: (value: React.SetStateAction<boolean>) => void;
  setSyncError: (value: React.SetStateAction<Error | null>) => void;
  setRestOperations: (value: React.SetStateAction<IOperation[]>) => void;
  chainId: string;
  address: string;
  assetSlug?: string;
  operations?: IOperation[];
  hasMoreRef: React.MutableRefObject<boolean>;
}

const handleLoadMore = async ({
  setLoadingMore,
  setSyncError,
  setRestOperations,
  chainId,
  address,
  assetSlug,
  operations,
  hasMoreRef
}: IHandlerLoadMore) => {
  setLoadingMore(true);

  try {
    await syncOperations('old', chainId, address);
  } catch (err: any) {
    console.error(err);
    setSyncError(err);
  }

  try {
    const oldOperations = await fetchOperations({
      chainId,
      address,
      assetIds: assetSlug ? [assetSlug] : undefined,
      limit: ACTIVITY_PAGE_SIZE,
      offset: operations?.length ?? 0
    });
    if (oldOperations.length === 0) {
      hasMoreRef.current = false;
    }

    setRestOperations((ops: IOperation[]) => [...ops, ...oldOperations]);
  } catch (err: any) {
    console.error(err);
  }

  setLoadingMore(false);
};
