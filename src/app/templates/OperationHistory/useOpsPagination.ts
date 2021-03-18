import { useCallback, useEffect, useRef, useState } from "react";

import BigNumber from "bignumber.js";

import { InternalTransfer, OperationPreview } from "app/templates/Operation";
import { BcdTokenTransfer } from "lib/better-call-dev";
import { TempleAsset, TempleAssetType } from "lib/temple/types";
import { TZStatsOperation } from "lib/tzstats";

const PAGE_SIZE = 20;
const PAGE_SIZE_FOR_EXPLORERS = 10;

type GroupedTzStatsOps = Record<string, TZStatsOperation[]>;
type GroupedBcdOps = Record<string, BcdTokenTransfer[]>;

type FetchFn = (
  tzStatsOffset: number,
  bcdEnd: number | undefined,
  pageSize: number
) => Promise<{
  bcdEnd?: number;
  newBcdOps: GroupedBcdOps;
  newTzStatsOps: GroupedTzStatsOps;
  tzStatsReachedEnd: boolean;
  bcdReachedEnd: boolean;
}>;
export function useOpsPagination(fetchFn: FetchFn, asset?: TempleAsset) {
  const tzStatsReachedEndRef = useRef(false);
  const bcdReachedEndRef = useRef(false);
  const tzStatsOpsRef = useRef<GroupedTzStatsOps>({});
  const bcdOpsRef = useRef<GroupedBcdOps>({});
  const [ops, setOps] = useState<OperationPreview[]>([]);
  const [opsEnded, setOpsEnded] = useState(false);
  const opsRef = useRef<OperationPreview[]>([]);
  const pageNumberRef = useRef(0);
  const bcdEndRef = useRef<number | undefined>(undefined);
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const prevFetchFn = useRef(fetchFn);
  const prevAsset = useRef(asset);
  const firstTimeRef = useRef(true);

  const loadOperations = useCallback(
    async (tzStatsOffset: number, prevBcdEnd?: number) => {
      try {
        const {
          bcdEnd,
          newBcdOps,
          newTzStatsOps,
          tzStatsReachedEnd,
          bcdReachedEnd,
        } = await fetchFn(tzStatsOffset, prevBcdEnd, PAGE_SIZE_FOR_EXPLORERS);
        tzStatsReachedEndRef.current = tzStatsReachedEnd;
        bcdReachedEndRef.current = bcdReachedEnd;
        setError(undefined);
        return {
          bcdEnd,
          newBcdOps,
          newTzStatsOps,
          bcdReachedEnd,
          tzStatsReachedEnd,
        };
      } catch (err) {
        const noTransactionsMoreAvailable =
          err?.origin?.response?.status === 404;
        if (!noTransactionsMoreAvailable) {
          // Human delay
          await new Promise((r) => setTimeout(r, 300));
          setError(err);
        }
        return {
          newBcdOps: {},
          newTzStatsOps: {},
          bcdReachedEnd: true,
          tzStatsReachedEnd: true,
        };
      }
    },
    [fetchFn]
  );

  const updateOpsStates = useCallback(
    (
      totalTzStatsOps: GroupedTzStatsOps,
      totalBcdOps: GroupedBcdOps,
      ops?: OperationPreview[]
    ) => {
      tzStatsOpsRef.current = totalTzStatsOps;
      bcdOpsRef.current = totalBcdOps;
      const totalOps =
        ops ||
        groupedOpsToOperationsPreview(
          totalTzStatsOps,
          totalBcdOps,
          asset
        ).slice(0, pageNumberRef.current * PAGE_SIZE);
      setOps(totalOps);
      opsRef.current = totalOps;
    },
    [asset]
  );

  const refresh = useCallback(async () => {
    const { newBcdOps, newTzStatsOps } = await loadOperations(0, 0);
    const totalBcdOps = mergeBcdOps(bcdOpsRef.current, newBcdOps);
    const totalTzStatsOps = mergeTzStatsOps(
      tzStatsOpsRef.current,
      newTzStatsOps
    );
    updateOpsStates(totalTzStatsOps, totalBcdOps);
  }, [loadOperations, updateOpsStates]);

  useEffect(() => {
    const interval = setInterval(() => refresh(), 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    pageNumberRef.current = Math.floor(opsRef.current.length / PAGE_SIZE) + 1;

    opsRef.current = groupedOpsToOperationsPreview(
      tzStatsOpsRef.current,
      bcdOpsRef.current,
      asset
    );
    const maxOpsCount = pageNumberRef.current * PAGE_SIZE;
    while (
      opsRef.current.length < maxOpsCount &&
      (!tzStatsReachedEndRef.current || !bcdReachedEndRef.current)
    ) {
      const tzStatsOffset = Object.values(tzStatsOpsRef.current).reduce(
        (sum, ops) => sum + ops.length,
        0
      );
      const {
        bcdEnd,
        newBcdOps,
        newTzStatsOps,
        bcdReachedEnd,
        tzStatsReachedEnd,
      } = await loadOperations(tzStatsOffset, bcdEndRef.current);
      bcdEndRef.current = bcdEnd;
      bcdReachedEndRef.current = bcdReachedEnd;
      tzStatsReachedEndRef.current = tzStatsReachedEnd;
      bcdOpsRef.current = mergeBcdOps(bcdOpsRef.current, newBcdOps);
      tzStatsOpsRef.current = mergeTzStatsOps(
        tzStatsOpsRef.current,
        newTzStatsOps
      );
      opsRef.current = groupedOpsToOperationsPreview(
        tzStatsOpsRef.current,
        bcdOpsRef.current,
        asset
      );
    }
    setOpsEnded(
      tzStatsReachedEndRef.current &&
        bcdReachedEndRef.current &&
        opsRef.current.length <= maxOpsCount
    );
    opsRef.current = opsRef.current.slice(0, maxOpsCount);
    updateOpsStates(tzStatsOpsRef.current, bcdOpsRef.current, opsRef.current);
    setLoading(false);
  }, [loadOperations, updateOpsStates, asset]);

  useEffect(() => {
    if (
      firstTimeRef.current ||
      prevFetchFn.current !== fetchFn ||
      prevAsset.current !== asset
    ) {
      tzStatsReachedEndRef.current = false;
      bcdReachedEndRef.current = false;
      pageNumberRef.current = 0;
      updateOpsStates({}, {}, []);
      setOpsEnded(false);
      setLoading(true);
      setError(undefined);
      loadMore();
    }
    firstTimeRef.current = false;
    prevFetchFn.current = fetchFn;
    prevAsset.current = asset;
  }, [updateOpsStates, loadMore, fetchFn, asset]);

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
  asset?: TempleAsset
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
  const tezOnly = asset?.type === TempleAssetType.TEZ;
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
        if (!tezOnly) {
          return true;
        }
        return (
          volume > 0 &&
          (type !== "transaction" || !entrypoint || entrypoint === "transfer")
        );
      }),
    ...(tezOnly
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
