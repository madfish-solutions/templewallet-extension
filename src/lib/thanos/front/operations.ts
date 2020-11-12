import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNetwork, useAccount } from "lib/thanos/front";
import {
  BcdTokenTransfer,
  getTokenTransfers,
  isBcdSupportedNetwork,
} from "lib/better-call-dev";
import {
  getOperations as getTzktOperations,
  isTzktSupportedNetwork,
  TzktOperation,
} from "lib/tzkt";

const OPERATIONS_PER_PAGE = 20;

type OperationEntry =
  | {
      type: "bcd";
      operation: BcdTokenTransfer;
    }
  | {
      type: "tzkt";
      operation: TzktOperation;
    };

export function useOperations() {
  const { id: networkId } = useNetwork();
  const { publicKeyHash: accountPkh } = useAccount();
  const [rawOperations, setRawOperations] = useState<
    Record<string, OperationEntry>
  >({});
  const [error, setError] = useState<Error>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReachingEnd, setIsReachingEnd] = useState(false);
  const lastBcdIdRef = useRef<string>();
  const lastTzktIdRef = useRef<number>();
  const rawOperationsRef = useRef<Record<string, OperationEntry>>({});

  useEffect(() => {
    rawOperationsRef.current = rawOperations;
  }, [rawOperations]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const newBcdOperations: BcdTokenTransfer[] = [];
    let outOfBcdOperations = false;
    let lastBcdId: string | undefined;
    const bcdOperationsNeeded = Math.floor(OPERATIONS_PER_PAGE / 2);
    const minTimestampAcceptable = Object.values(rawOperationsRef.current).reduce(
      (timestamp, operation) => {
        const { timestamp: newTimestamp } = operation.operation;
        if (newTimestamp && new Date(newTimestamp).getTime() < timestamp) {
          return new Date(newTimestamp).getTime();
        }
        return timestamp;
      },
      Infinity
    );
    while (
      (newBcdOperations[newBcdOperations.length - 1]?.indexed_time || 0) >=
        minTimestampAcceptable &&
      !outOfBcdOperations
    ) {
      if (!isBcdSupportedNetwork(networkId)) {
        outOfBcdOperations = true;
        break;
      }
      const { transfers: bcdTransfers, last_id } = await getTokenTransfers({
        address: accountPkh,
        network: networkId,
        last_id: lastBcdId,
        size: bcdOperationsNeeded,
      });
      outOfBcdOperations = bcdTransfers.length < bcdOperationsNeeded;
      newBcdOperations.push(...bcdTransfers);
      lastBcdId = last_id;
    }
    const newBcdOperationsSlice = newBcdOperations.filter(
      ({ timestamp }) =>
        timestamp && new Date(timestamp).getTime() >= minTimestampAcceptable
    );
    console.log(newBcdOperationsSlice);
    setIsRefreshing(false);
  }, [networkId, accountPkh]);

  const loadMore = useCallback(async () => {
    try {
      setIsLoadingMore(true);
      const newBcdOperations: BcdTokenTransfer[] = [];
      let bcdOperationsForReplacement: BcdTokenTransfer[] = [];
      let outOfBcdOperations = false;
      let newBcdLastId = lastBcdIdRef.current;
      const bcdOperationsNeeded = Math.floor(OPERATIONS_PER_PAGE / 2);
      while (
        newBcdOperations.length < bcdOperationsNeeded &&
        !outOfBcdOperations
      ) {
        if (!isBcdSupportedNetwork(networkId)) {
          outOfBcdOperations = true;
          break;
        }
        const { transfers: bcdTransfers, last_id } = await getTokenTransfers({
          address: accountPkh,
          network: networkId,
          last_id:
            newBcdLastId === undefined ? undefined : String(newBcdLastId),
          size: bcdOperationsNeeded,
        });
        outOfBcdOperations = bcdTransfers.length === 0;
        bcdTransfers.forEach((transfer) => {
          if (rawOperationsRef.current[transfer.hash]) {
            bcdOperationsForReplacement.push(transfer);
          } else {
            newBcdOperations.push(transfer);
          }
        });
        newBcdLastId = last_id;
      }
      const newBcdOperationsSlice = newBcdOperations.slice(
        0,
        bcdOperationsNeeded
      );
      const lastNewBcdOperationId =
        newBcdOperationsSlice[newBcdOperationsSlice.length - 1]?.indexed_time;
      const lastBcdOperationForReplacementId =
        bcdOperationsForReplacement[bcdOperationsForReplacement.length - 1]
          ?.indexed_time;
      const lastBcdOperationId = lastNewBcdOperationId
        ? String(
            Math.min(
              lastNewBcdOperationId ?? Infinity,
              lastBcdOperationForReplacementId ?? Infinity
            )
          )
        : lastBcdOperationForReplacementId
        ? String(lastBcdOperationForReplacementId)
        : undefined;
      lastBcdIdRef.current = lastBcdOperationId ?? lastBcdIdRef.current;

      let newTzktOperations: TzktOperation[] = [];
      let outOfTzktOperations = false;
      let newTzktLastId = lastTzktIdRef.current;
      const tzktOperationsNeeded =
        OPERATIONS_PER_PAGE - newBcdOperationsSlice.length;
      while (
        newTzktOperations.length < tzktOperationsNeeded &&
        !outOfTzktOperations
      ) {
        if (!isTzktSupportedNetwork(networkId)) {
          outOfTzktOperations = true;
          break;
        }
        const fetchedTzktOperations = await getTzktOperations(networkId, {
          address: accountPkh,
          lastId: newTzktLastId,
          limit: 10,
        });
        outOfTzktOperations = fetchedTzktOperations.length === 0;
        newTzktOperations.push(
          ...fetchedTzktOperations.filter(
            (operation) =>
              !rawOperationsRef.current[operation.hash] &&
              !newBcdOperations.find((op) => op.hash === operation.hash)
          )
        );
        newTzktLastId =
          fetchedTzktOperations[fetchedTzktOperations.length - 1]?.id;
      }
      newTzktOperations = newTzktOperations.slice(0, tzktOperationsNeeded);
      const newLastTzktOperationId =
        newTzktOperations[newTzktOperations.length - 1]?.id;
      lastTzktIdRef.current = newLastTzktOperationId ?? lastTzktIdRef.current;
      setIsReachingEnd(outOfBcdOperations && outOfTzktOperations);
      const total = {
        ...newTzktOperations.reduce<
          Record<string, { type: "tzkt"; operation: TzktOperation }>
        >(
          (part, operation) => ({
            ...part,
            [operation.hash]: {
              type: "tzkt",
              operation,
            },
          }),
          {}
        ),
        ...rawOperationsRef.current,
        ...[...newBcdOperationsSlice, ...bcdOperationsForReplacement].reduce<
          Record<string, { type: "bcd"; operation: BcdTokenTransfer }>
        >(
          (part, operation) => ({
            ...part,
            [operation.hash]: {
              type: "bcd",
              operation,
            },
          }),
          {}
        ),
      };
      setRawOperations(total);
      setError(undefined);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [accountPkh, networkId]);

  useEffect(() => {
    loadMore();
  }, [accountPkh, networkId, loadMore]);

  const { bcdOperations, tzktOperations } = useMemo(() => {
    const result = {
      bcdOperations: [] as BcdTokenTransfer[],
      tzktOperations: [] as TzktOperation[],
    };
    Object.values(rawOperations).forEach((value) => {
      if (value.type === "bcd") {
        result.bcdOperations.push(value.operation);
      } else {
        result.tzktOperations.push(value.operation);
      }
    });
    return result;
  }, [rawOperations]);

  return {
    bcdOperations,
    tzktOperations,
    error,
    isLoadingMore,
    loadMore,
    refresh,
    isRefreshing,
    isReachingEnd,
  };
}
