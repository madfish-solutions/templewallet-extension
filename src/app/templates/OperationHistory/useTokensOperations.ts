import { useCallback } from "react";

import {
  useOpsPagination,
  groupOpsByHash,
} from "app/templates/OperationHistory/useOpsPagination";
import { getTokenTransfers } from "lib/better-call-dev";
import { TempleAssetType, TempleToken } from "lib/temple/types";
import {
  getAccountWithOperations,
  TZStatsNetwork,
  TZStatsOperation,
} from "lib/tzstats";

export type GetOperationsParams = {
  accountPkh: string;
  tzStatsNetwork: TZStatsNetwork | null;
  networkId: "mainnet" | "edo2net" | "florencenet" | "delphinet" | null;
  asset: TempleToken;
};

export default function useTokensOperations({
  accountPkh,
  tzStatsNetwork,
  networkId,
  asset,
}: GetOperationsParams) {
  const fetchFn = useCallback(
    async (
      tzStatsOffset: number,
      bcdEnd: number | undefined,
      pageSize: number
    ) => {
      const { transfers: rawBcdOps } = networkId
        ? await getTokenTransfers({
            network: networkId,
            address: accountPkh,
            size: pageSize,
            contracts: asset.address,
            end: bcdEnd,
            token_id: asset.type === TempleAssetType.FA2 ? asset.id : undefined,
          })
        : { transfers: [] };
      const lastBcdOp = rawBcdOps[rawBcdOps.length - 1];
      const lastBcdOpTime = new Date(lastBcdOp?.timestamp || 0);
      const groupedBcdOps = groupOpsByHash(rawBcdOps);
      const tzStatsOps: TZStatsOperation[] = [];
      let shouldStopFetchBcdOperations = rawBcdOps.length === 0;
      let i = 0;
      while (!shouldStopFetchBcdOperations && tzStatsNetwork) {
        const { ops } = await getAccountWithOperations(tzStatsNetwork, {
          pkh: accountPkh,
          order: "desc",
          limit: pageSize,
          offset: tzStatsOffset + pageSize * i,
        });
        tzStatsOps.push(...ops);
        const lastTzStatsOp = tzStatsOps[tzStatsOps.length - 1];
        shouldStopFetchBcdOperations =
          ops.length === 0 || new Date(lastTzStatsOp.time) < lastBcdOpTime;
        i++;
      }
      const groupedTzStatsOps = tzStatsOps
        .filter(({ time }) => new Date(time) >= lastBcdOpTime)
        .reduce<Record<string, TZStatsOperation[]>>(
          (newOps, op) => ({
            ...newOps,
            [op.hash]: [...(newOps[op.hash] || []), op],
          }),
          {}
        );
      const relevantGroupedTzStatsOps = Object.keys(groupedBcdOps).reduce<
        Record<string, TZStatsOperation[]>
      >((relevantOps, opHash) => {
        if (groupedTzStatsOps[opHash]) {
          return {
            ...relevantOps,
            [opHash]: groupedTzStatsOps[opHash],
          };
        }
        return relevantOps;
      }, {});
      const relevantTzStatsOpsCount = Object.values(
        relevantGroupedTzStatsOps
      ).reduce((sum, ops) => sum + ops.length, 0);

      return {
        bcdEnd: lastBcdOp
          ? Math.floor(lastBcdOpTime.getTime() / 1000)
          : undefined,
        newBcdOps: groupedBcdOps,
        newTzStatsOps: relevantGroupedTzStatsOps,
        bcdReachedEnd: rawBcdOps.length < pageSize,
        tzStatsReachedEnd:
          relevantTzStatsOpsCount < pageSize || rawBcdOps.length < pageSize,
      };
    },
    [accountPkh, networkId, tzStatsNetwork, asset]
  );

  return useOpsPagination(fetchFn, asset);
}
