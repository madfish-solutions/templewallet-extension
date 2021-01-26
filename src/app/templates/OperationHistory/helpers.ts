import BigNumber from "bignumber.js";
import React from "react";
import { BcdTokenTransfer } from "lib/better-call-dev";
import { TZStatsOperation } from "lib/tzstats";
import { ThanosAsset, ThanosAssetType } from "lib/thanos/types";
import { InternalTransfer, OperationPreview } from "app/templates/Operation";

export const PAGE_SIZE = 20;

export type GroupedTzStatsOps = Record<string, TZStatsOperation[]>;
export type GroupedBcdOps = Record<string, BcdTokenTransfer[]>;

export type FetchFn = (
  tzStatsOffset: number,
  bcdLastId: string | undefined,
  pageSize: number
) => Promise<{
  lastBcdId?: string;
  newBcdOps: GroupedBcdOps;
  newTzStatsOps: GroupedTzStatsOps;
  tzStatsReachedEnd: boolean;
  bcdReachedEnd: boolean;
}>;
export function useOpsPagination(fetchFn: FetchFn, asset?: ThanosAsset) {
  const tzStatsReachedEndRef = React.useRef(false);
  const bcdReachedEndRef = React.useRef(false);
  const tzStatsOpsRef = React.useRef<GroupedTzStatsOps>({});
  const bcdOpsRef = React.useRef<GroupedBcdOps>({});
  const [ops, setOps] = React.useState<OperationPreview[]>([]);
  const [opsEnded, setOpsEnded] = React.useState(false);
  const opsRef = React.useRef<OperationPreview[]>([]);
  const pageNumberRef = React.useRef(0);
  const [error, setError] = React.useState<Error>();
  const lastBcdIdRef = React.useRef<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  const loadOperations = React.useCallback(
    async (tzStatsOffset: number, bcdLastId?: string) => {
      try {
        const {
          lastBcdId,
          newBcdOps,
          newTzStatsOps,
          tzStatsReachedEnd,
          bcdReachedEnd,
        } = await fetchFn(tzStatsOffset, bcdLastId, PAGE_SIZE);
        tzStatsReachedEndRef.current = tzStatsReachedEnd;
        bcdReachedEndRef.current = bcdReachedEnd;
        setError(undefined);
        return {
          lastBcdId,
          newBcdOps,
          newTzStatsOps,
        };
      } catch (err) {
        if (err?.origin?.response?.status === 404) {
          tzStatsReachedEndRef.current = true;
          bcdReachedEndRef.current = true;
        } else {
          // Human delay
          await new Promise((r) => setTimeout(r, 300));
          setError(err);
        }
        return { newBcdOps: {}, newTzStatsOps: {}, lastBcdId: undefined };
      }
    },
    [fetchFn]
  );

  const updateOpsStates = React.useCallback(
    (
      totalTzStatsOps: GroupedTzStatsOps,
      totalBcdOps: GroupedBcdOps,
      ops?: OperationPreview[]
    ) => {
      tzStatsOpsRef.current = totalTzStatsOps;
      bcdOpsRef.current = totalBcdOps;
      const totalOps =
        ops ||
        groupedOpsToOperationsPreview(totalTzStatsOps, totalBcdOps, asset);
      setOps(totalOps);
      opsRef.current = totalOps;
    },
    [asset]
  );

  const refresh = React.useCallback(async () => {
    const { newBcdOps, newTzStatsOps } = await loadOperations(0);
    const totalBcdOps = mergeBcdOps(bcdOpsRef.current, newBcdOps);
    const totalTzStatsOps = mergeTzStatsOps(
      tzStatsOpsRef.current,
      newTzStatsOps
    );
    updateOpsStates(totalTzStatsOps, totalBcdOps);
  }, [loadOperations, updateOpsStates]);

  React.useEffect(() => {
    const interval = setInterval(() => refresh(), 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const loadMore = React.useCallback(async () => {
    setLoading(true);
    pageNumberRef.current = pageNumberRef.current + 1;

    while (
      opsRef.current.length < pageNumberRef.current * PAGE_SIZE &&
      !tzStatsReachedEndRef.current &&
      !bcdReachedEndRef.current
    ) {
      const tzStatsOffset = Object.keys(tzStatsOpsRef.current).reduce(
        (sum, opHash) => sum + tzStatsOpsRef.current[opHash].length,
        0
      );
      const { lastBcdId, newBcdOps, newTzStatsOps } = await loadOperations(
        tzStatsOffset,
        lastBcdIdRef.current
      );
      lastBcdIdRef.current = lastBcdId;
      bcdOpsRef.current = mergeBcdOps(bcdOpsRef.current, newBcdOps);
      tzStatsOpsRef.current = mergeTzStatsOps(
        tzStatsOpsRef.current,
        newTzStatsOps
      );
      opsRef.current = groupedOpsToOperationsPreview(
        tzStatsOpsRef.current,
        bcdOpsRef.current
      );
    }
    opsRef.current = opsRef.current.slice(0, pageNumberRef.current * PAGE_SIZE);
    updateOpsStates(tzStatsOpsRef.current, bcdOpsRef.current, opsRef.current);
    setOpsEnded(tzStatsReachedEndRef.current && bcdReachedEndRef.current);
    setLoading(false);
  }, [loadOperations, updateOpsStates]);

  React.useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    error,
    loading,
    ops,
    opsEnded,
    refresh,
    loadMore,
  };
}

export function groupOpsByHash<T extends TZStatsOperation | BcdTokenTransfer>(
  ops: T[]
) {
  return ops.reduce<Record<string, T[]>>(
    (groupedOps, op) => ({
      ...groupedOps,
      [op.hash]: [...(groupedOps[op.hash] || []), op],
    }),
    {}
  );
}

function mergeBcdOps(ops: GroupedBcdOps, delta: GroupedBcdOps) {
  return Object.keys(delta).reduce((newOps, opHash) => {
    if (!newOps[opHash]) {
      return {
        ...newOps,
        [opHash]: delta[opHash],
      };
    }
    return {
      ...newOps,
      [opHash]: [
        ...newOps[opHash],
        ...delta[opHash].filter(
          ({ counter }) =>
            !newOps[opHash].find(
              ({ counter: counter2 }) => counter2 === counter
            )
        ),
      ],
    };
  }, ops);
}

function mergeTzStatsOps(ops: GroupedTzStatsOps, delta: GroupedTzStatsOps) {
  return Object.keys(delta).reduce((newOps, opHash) => {
    if (!newOps[opHash]) {
      return {
        ...newOps,
        [opHash]: delta[opHash],
      };
    }
    return {
      ...newOps,
      [opHash]: [
        ...newOps[opHash],
        ...delta[opHash].filter(
          ({ counter, type }) =>
            !newOps[opHash].find(
              ({ counter: counter2, type: type2 }) =>
                type === type2 && counter === counter2
            )
        ),
      ],
    };
  }, ops);
}

function groupedOpsToOperationsPreview(
  tzStatsOps: GroupedTzStatsOps,
  bcdOps: GroupedBcdOps,
  asset?: ThanosAsset
) {
  const pureBcdOps = Object.keys(bcdOps).reduce<
    Record<string, BcdTokenTransfer[]>
  >((transfers, hash) => {
    if (tzStatsOps[hash]) {
      return transfers;
    }
    return {
      ...transfers,
      [hash]: bcdOps[hash],
    };
  }, {});
  const xtzOnly = asset?.type === ThanosAssetType.XTZ;
  return [
    ...Object.keys(tzStatsOps)
      .reduce<OperationPreview[]>((prevMergedOps, opHash) => {
        const opsChunk = tzStatsOps[opHash];
        const bcdOpsChunk = bcdOps[opHash] || [];
        const mergedOps = opsChunk.reduce<OperationPreview[]>(
          (mergedOpsFromChunk, op, index) => {
            const transfersFromParams =
              op.type === "transaction" &&
              (op.parameters as any)?.entrypoint === "transfer"
                ? tryGetTransfers(op.parameters)
                : null;
            const transfersFromVolumeProp =
              op.type === "transaction" &&
              (!op.parameters || (bcdOps[op.hash] && op.volume > 0))
                ? [
                    {
                      volume: new BigNumber(op.volume),
                      sender: op.sender,
                      receiver: op.receiver,
                    },
                  ]
                : [];
            const internalTransfers = [
              ...(transfersFromParams || transfersFromVolumeProp).map(
                (transfer) => ({
                  ...transfer,
                  tokenAddress: transfersFromParams ? op.receiver : undefined,
                })
              ),
              ...((transfersFromParams?.length || 0) >= bcdOpsChunk.length ||
              index > 0
                ? []
                : bcdOpsChunk
              ).map((bcdOp) => ({
                volume: new BigNumber(bcdOp.amount),
                tokenId: bcdOp.token_id,
                sender: bcdOp.from,
                receiver: bcdOp.to,
                tokenAddress: bcdOp.contract,
              })),
            ];
            const transactionIndex = mergedOpsFromChunk.findIndex(
              ({ type }) => type === "transaction"
            );
            if (op.type !== "transaction" || transactionIndex === -1) {
              return [
                ...mergedOpsFromChunk,
                {
                  counter: op.counter,
                  delegate: op.type === "delegation" ? op.delegate : undefined,
                  entrypoint: (op.parameters as any)?.entrypoint,
                  internalTransfers,
                  hash: op.hash,
                  status: op.status,
                  time: op.time,
                  type: op.type,
                  volume: op.volume,
                  rawReceiver: op.receiver,
                },
              ];
            }
            const oldTransaction = mergedOpsFromChunk[transactionIndex];
            mergedOpsFromChunk[transactionIndex] = {
              ...mergedOpsFromChunk[transactionIndex],
              internalTransfers: [
                ...oldTransaction.internalTransfers,
                ...internalTransfers,
              ],
            };
            return mergedOpsFromChunk;
          },
          []
        );
        return [...prevMergedOps, ...mergedOps];
      }, [])
      .filter(({ volume, type, entrypoint }) => {
        if (!xtzOnly) {
          return true;
        }
        return (
          volume > 0 &&
          (type !== "transaction" || !entrypoint || entrypoint === "transfer")
        );
      }),
    ...(xtzOnly
      ? []
      : Object.values(pureBcdOps).map((bcdOpsChunk) => ({
          internalTransfers: bcdOpsChunk.map((bcdOp) => ({
            volume: new BigNumber(bcdOp.amount),
            tokenId: bcdOp.token_id,
            sender: bcdOp.from,
            receiver: bcdOp.to,
            tokenAddress: bcdOp.contract,
          })),
          hash: bcdOpsChunk[0].hash,
          status: bcdOpsChunk[0].status,
          time: bcdOpsChunk[0].timestamp,
          type: "transaction",
          volume: 0,
        }))),
  ];
}

export function tryGetTransfers(parameters: any): InternalTransfer[] | null {
  try {
    if (parameters.value instanceof Array) {
      const parsedTransfers: InternalTransfer[] = [];
      parameters.value.forEach(
        ({ args: transfersBatchArgs }: Record<string, any>) => {
          const sender = transfersBatchArgs[0].string;
          const transfers = transfersBatchArgs[1];
          transfers.forEach(({ args: transferArgs }: Record<string, any>) => {
            const receiver = transferArgs[0].string;
            const tokenId = Number(transferArgs[1].args[0].int);
            const rawAmount = transferArgs[1].args[1].int;
            const volume = new BigNumber(rawAmount);
            parsedTransfers.push({
              sender,
              receiver,
              volume,
              tokenId,
            });
          });
        }
      );
      return parsedTransfers;
    } else if (
      "transfer" in parameters.value &&
      parameters.value.transfer instanceof Array
    ) {
      const parsedTransfers: InternalTransfer[] = [];
      parameters.value.transfer.forEach(
        ({ from_, txs }: Record<string, any>) => {
          txs.forEach(({ amount, to_, token_id }: Record<string, any>) => {
            parsedTransfers.push({
              sender: from_,
              receiver: to_,
              volume: new BigNumber(amount),
              tokenId: Number(token_id),
            });
          });
        }
      );
      return parsedTransfers;
    } else if ("transfer" in parameters.value) {
      const { from: sender, to: receiver, value } = parameters.value.transfer;
      const volume = new BigNumber(value);

      return [
        {
          sender,
          receiver,
          volume,
        },
      ];
    } else {
      const [fromArgs, { args: toArgs }] = parameters.value.args;
      const sender: string = fromArgs.string;
      const receiver: string = toArgs[0].string;
      const volume = new BigNumber(toArgs[1].int);
      return [
        {
          sender,
          receiver,
          volume,
        },
      ];
    }
  } catch (_err) {
    return null;
  }
}
