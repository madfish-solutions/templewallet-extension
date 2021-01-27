import React from "react";
import {
  BcdPageableTokenTransfers,
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
  networkId: "mainnet" | "carthagenet" | "delphinet" | null;
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
      bcdLastId: string | undefined,
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
      let currentLastBcdId = bcdLastId;
      let bcdReachedEnd = true;
      const lastTzStatsOp = newTzStatsOps[newTzStatsOps.length - 1];
      let shouldStopFetchBcdOperations = false;
      while (!shouldStopFetchBcdOperations && networkId) {
        const {
          last_id,
          transfers,
        }: BcdPageableTokenTransfers = await getTokenTransfers({
          network: networkId,
          address: accountPkh,
          size: pageSize,
          last_id: currentLastBcdId,
        });
        currentLastBcdId = last_id || currentLastBcdId;
        const newBcdOps = transfers.filter((transfer) =>
          lastTzStatsOp
            ? new Date(transfer.timestamp) >= new Date(lastTzStatsOp.time)
            : true
        );
        totalNewBcdOps = [
          ...totalNewBcdOps,
          ...newBcdOps
        ];
        bcdReachedEnd =
          newBcdOps.length === transfers.length && transfers.length < pageSize;
        shouldStopFetchBcdOperations =
          bcdReachedEnd || (transfers.length > newBcdOps.length);
      }

      return {
        lastBcdId: currentLastBcdId,
        newBcdOps: groupOpsByHash(totalNewBcdOps),
        newTzStatsOps: groupOpsByHash(newTzStatsOps),
        tzStatsReachedEnd: newTzStatsOps.length < pageSize,
        bcdReachedEnd,
      };
    },
    [accountPkh, networkId, tzStatsNetwork]
  );

  return useOpsPagination(fetchFn, xtzOnly ? XTZ_ASSET : undefined);
}
