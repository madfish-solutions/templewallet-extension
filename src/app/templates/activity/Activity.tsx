import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";

import { ACTIVITY_PAGE_SIZE } from "app/defaults";
import {
  useChainId,
  fetchOperations,
  syncOperations,
  isSyncSupported,
} from "lib/temple/front";

import ActivityView from "./ActivityView";

type ActivityProps = {
  address: string;
  assetId?: string;
  className?: string;
};

const Activity = memo<ActivityProps>(({ address, assetId, className }) => {
  const chainId = useChainId(true)!;
  const syncSupported = useMemo(() => isSyncSupported(chainId), [chainId]);

  const [syncing, setSyncing] = useState(false);
  const [limit, setLimit] = useState(ACTIVITY_PAGE_SIZE);
  const [, setError] = useState<Error | null>(null);

  const operations = useLiveQuery(
    () =>
      fetchOperations({
        chainId,
        address,
        assetIds: assetId ? [assetId] : undefined,
        limit,
      }),
    [chainId, address, assetId, limit]
  );

  useEffect(() => {
    if (syncSupported) {
      (async () => {
        setSyncing(true);
        try {
          await syncOperations("new", chainId, address);
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.error(err);
          }

          setError(err);
        }
        setSyncing(false);
      })();
    }
  }, [syncSupported, setSyncing, chainId, address]);

  const handleLoadMore = useCallback(async () => {
    setSyncing(true);
    try {
      await syncOperations("old", chainId, address);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    }
    setSyncing(false);
    setLimit((l) => l + ACTIVITY_PAGE_SIZE);
  }, [chainId, address, setSyncing, setLimit]);

  return (
    <ActivityView
      address={address}
      syncSupported={syncSupported}
      operations={operations}
      loading={syncing}
      loadMoreDisplayed={true}
      loadMore={handleLoadMore}
      className={className}
    />
  );
});

export default Activity;
