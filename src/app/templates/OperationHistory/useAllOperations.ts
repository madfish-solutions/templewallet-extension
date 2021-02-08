import React from "react";
import {
  BcdTokenTransfers,
  BcdTokenTransfer,
  getTokenTransfers,
} from "lib/better-call-dev";
import {
  getAccountWithOperations,
  TZStatsNetwork,
  TZStatsOperation,
} from "lib/tzstats";
import { XTZ_ASSET } from "lib/thanos/front";
import {
  useOpsPagination,
  groupOpsByHash,
} from "app/templates/OperationHistory/useOpsPagination";

export type GetOperationsParams = {
  accountPkh: string;
  tzStatsNetwork: TZStatsNetwork | null;
  networkId: "mainnet" | "delphinet" | null;
  xtzOnly?: boolean;
};

export default function useAllOperations({
  accountPkh,
  tzStatsNetwork,
  networkId,
  xtzOnly,
}: GetOperationsParams) {
  const fetchFn = React.useCallback(
    async (
      tzStatsOffset: number,
      bcdEnd: number | undefined,
      pageSize: number
    ) => {
      const { ops: newTzStatsOps } = tzStatsNetwork
        ? await getAccountWithOperations(tzStatsNetwork, {
            pkh: accountPkh,
            order: "desc",
            limit: pageSize,
            offset: tzStatsOffset,
          })
        : { ops: [] as TZStatsOperation[] };

      let totalNewBcdOps: BcdTokenTransfer[] = [];
      let currentBcdEnd = bcdEnd;
      let bcdReachedEnd = true;
      const lastTzStatsOp = newTzStatsOps[newTzStatsOps.length - 1];
      let shouldStopFetchBcdOperations = false;
      while (!shouldStopFetchBcdOperations && networkId) {
        const { transfers }: BcdTokenTransfers = await getTokenTransfers({
          network: networkId,
          address: accountPkh,
          size: pageSize,
          end: currentBcdEnd,
        });
        const lastNewTransfer = transfers[transfers.length - 1];
        currentBcdEnd = lastNewTransfer
          ? Math.floor(new Date(lastNewTransfer.timestamp).getTime() / 1000)
          : currentBcdEnd;
        const newBcdOps = transfers.filter((transfer) =>
          lastTzStatsOp
            ? new Date(transfer.timestamp) >= new Date(lastTzStatsOp.time)
            : true
        );
        totalNewBcdOps = [...totalNewBcdOps, ...newBcdOps];
        bcdReachedEnd =
          newBcdOps.length === transfers.length && transfers.length < pageSize;
        shouldStopFetchBcdOperations =
          bcdReachedEnd || transfers.length > newBcdOps.length;
      }

      return {
        newBcdOps: groupOpsByHash(totalNewBcdOps),
        newTzStatsOps: groupOpsByHash(newTzStatsOps),
        tzStatsReachedEnd: newTzStatsOps.length < pageSize,
        bcdReachedEnd,
        bcdEnd: currentBcdEnd,
      };
    },
    [accountPkh, networkId, tzStatsNetwork]
  );

  return useOpsPagination(fetchFn, xtzOnly ? XTZ_ASSET : undefined);
}
