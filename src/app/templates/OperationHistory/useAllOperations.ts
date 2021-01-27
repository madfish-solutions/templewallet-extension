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
} from "app/templates/OperationHistory/helpers";

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

      let newBcdOps: BcdTokenTransfer[] = [];
      let lastBcdId: string | undefined;
      let bcdReachedEnd = true;
      const lastTzStatsOp = newTzStatsOps[newTzStatsOps.length - 1];
      if (networkId) {
        const {
          last_id,
          transfers,
        }: BcdPageableTokenTransfers = await getTokenTransfers({
          network: networkId,
          address: accountPkh,
          size: pageSize,
          last_id: bcdLastId,
        });
        lastBcdId = last_id;
        newBcdOps = transfers.filter((transfer) =>
          lastTzStatsOp
            ? new Date(transfer.timestamp) >= new Date(lastTzStatsOp.time)
            : true
        );
        bcdReachedEnd =
          newBcdOps.length === transfers.length && transfers.length < pageSize;
      }

      return {
        lastBcdId,
        newBcdOps: groupOpsByHash(newBcdOps),
        newTzStatsOps: groupOpsByHash(newTzStatsOps),
        tzStatsReachedEnd: newTzStatsOps.length < pageSize,
        bcdReachedEnd,
      };
    },
    [accountPkh, networkId, tzStatsNetwork]
  );

  return useOpsPagination(fetchFn, xtzOnly ? XTZ_ASSET : undefined);
}
