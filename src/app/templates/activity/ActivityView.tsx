import React, { memo } from "react";

import classNames from "clsx";

import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import Spinner from "app/atoms/Spinner";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";
import { T } from "lib/i18n/react";
import * as Repo from "lib/temple/repo";

import ActivityItem from "./ActivityItem";

type ActivityViewProps = {
  address: string;
  syncSupported: boolean;
  operations: Repo.IOperation[];
  initialLoading: boolean;
  loadingMore: boolean;
  syncing: boolean;
  loadMoreDisplayed: boolean;
  loadMore: () => void;
  className?: string;
};

const ActivityView = memo<ActivityViewProps>(
  ({
    address,
    syncSupported,
    operations,
    initialLoading,
    loadingMore,
    loadMoreDisplayed,
    loadMore,
    className,
  }) => {
    const noOperations = operations.length === 0;

    if (noOperations) {
      return initialLoading ? (
        <ActivitySpinner />
      ) : (
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
            <ActivityItem
              key={op.hash}
              address={address}
              operation={op}
              syncSupported={syncSupported}
            />
          ))}
        </div>

        {loadingMore ? (
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

const ActivitySpinner = memo(() => (
  <div
    className="w-full flex items-center justify-center mt-5 mb-3"
    style={{ height: "2.5rem" }}
  >
    <Spinner theme="gray" className="w-16" />
  </div>
));

export default ActivityView;
