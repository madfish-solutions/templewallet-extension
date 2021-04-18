import React, { memo, useCallback, useEffect, useMemo } from "react";

import classNames from "clsx";
import { useLiveQuery } from "dexie-react-hooks";

import {
  useChainId,
  fetchOperations,
  syncOperations,
  isSyncSupported,
} from "lib/temple/front";
import * as Repo from "lib/temple/repo";

type ActivityProps = {
  address: string;
  assetId?: string;
  className?: string;
};

const Activity = memo<ActivityProps>(({ address, assetId, className }) => {
  const chainId = useChainId(true)!;
  const syncSupported = useMemo(() => isSyncSupported(chainId), [chainId]);

  const liveOperations = useLiveQuery(
    () =>
      fetchOperations({
        chainId,
        address,
        assetIds: assetId ? [assetId] : undefined,
        limit: 100,
      }),
    [address, assetId]
  );

  useEffect(() => {
    if (syncSupported) {
      (async () => {
        try {
          await syncOperations("new", chainId, address);
        } catch {}
      })();
    }
  }, [syncSupported, chainId, address]);

  const loading = useMemo(() => {
    return Boolean(liveOperations);
  }, [liveOperations]);

  const handleLoadMore = useCallback(() => {
    console.info("load more");
  }, []);

  return (
    <ActivityView
      syncSupported={syncSupported}
      operations={liveOperations}
      loading={loading}
      loadMoreDisplayed={true}
      loadMore={handleLoadMore}
      className={className}
    />
  );
});

export default Activity;

type ActivityViewProps = {
  syncSupported: boolean;
  operations?: Repo.IOperation[];
  loading: boolean;
  loadMoreDisplayed: boolean;
  loadMore: () => void;
  className?: string;
};

const ActivityView = memo<ActivityViewProps>(({ operations, className }) => {
  return (
    <div
      className={classNames(
        "w-full max-w-md mx-auto",
        "flex flex-col",
        className
      )}
    >
      {operations?.map((op) => (
        <div key={op.hash} className="p-1">
          {op.hash}
        </div>
      ))}
    </div>
  );
});
