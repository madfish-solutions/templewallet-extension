import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

import classNames from "clsx";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useLiveQuery } from "dexie-react-hooks";

import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import Spinner from "app/atoms/Spinner";
import { ACTIVITY_PAGE_SIZE } from "app/defaults";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";
import HashChip from "app/templates/HashChip";
import { T, getDateFnsLocale } from "lib/i18n/react";
import {
  useChainId,
  fetchOperations,
  syncOperations,
  isSyncSupported,
  useExplorerBaseUrls,
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
    [address, assetId, limit]
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

type ActivityViewProps = {
  address: string;
  syncSupported: boolean;
  operations?: Repo.IOperation[];
  loading: boolean;
  loadMoreDisplayed: boolean;
  loadMore: () => void;
  className?: string;
};

const ActivityView = memo<ActivityViewProps>(
  ({
    address,
    operations,
    loading,
    loadMoreDisplayed,
    loadMore,
    className,
  }) => {
    if (!operations && loading) {
      return <ActivitySpinner />;
    } else if (!operations) {
      return (
        <div
          className={classNames(
            "mt-4 mb-12",
            "flex flex-col items-center justify-center",
            "text-gray-500"
          )}
        >
          <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

          <h3
            className="text-sm font-light text-center"
            style={{ maxWidth: "20rem" }}
          >
            <T id="noOperationsFound" />
          </h3>
        </div>
      );
    }

    return (
      <>
        <div
          className={classNames(
            "w-full max-w-md mx-auto",
            "flex flex-col",
            className
          )}
        >
          {operations?.map((op) => (
            <ActivityItem key={op.hash} address={address} operation={op} />
          ))}
        </div>

        {loading ? (
          <ActivitySpinner />
        ) : (
          <div className="w-full flex justify-center mt-5 mb-3">
            <FormSecondaryButton
              disabled={!loadMoreDisplayed}
              onClick={loadMore}
              small
            >
              <T id="loadMore" />
            </FormSecondaryButton>
          </div>
        )}
      </>
    );
  }
);

type ActivityItemProps = {
  address: string;
  operation: Repo.IOperation;
  className?: string;
};

const ActivityItem = memo<ActivityItemProps>(({ operation, className }) => {
  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();
  const { hash, addedAt } = operation;

  return (
    <div className={classNames("my-3", className)}>
      <div className="mb-1 w-full flex items-center">
        <HashChip
          hash={hash}
          firstCharsCount={10}
          lastCharsCount={7}
          small
          className="mr-2"
        />

        {explorerBaseUrl && (
          <OpenInExplorerChip
            baseUrl={explorerBaseUrl}
            opHash={hash}
            className="mr-2"
          />
        )}

        <div className={classNames("flex-1", "h-px", "bg-gray-200")} />
      </div>

      <Time
        children={() => (
          <span className="text-xs font-light text-gray-500">
            {formatDistanceToNow(new Date(addedAt), {
              includeSeconds: true,
              addSuffix: true,
              locale: getDateFnsLocale(),
            })}
          </span>
        )}
      />
    </div>
  );
});

type TimeProps = {
  children: () => React.ReactElement;
};

const Time: React.FC<TimeProps> = ({ children }) => {
  const [value, setValue] = useState(children);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(children());
    }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [setValue, children]);

  return value;
};

const ActivitySpinner = memo(() => (
  <div
    className="w-full flex items-center justify-center mt-5 mb-3"
    style={{ height: "2.5rem" }}
  >
    <Spinner theme="gray" className="w-16" />
  </div>
));
