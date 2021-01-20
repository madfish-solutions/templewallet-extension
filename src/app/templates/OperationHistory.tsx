import * as React from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import { useRetryableSWR } from "lib/swr";
import {
  TZSTATS_CHAINS,
  getAccountWithOperations,
  TZStatsNetwork,
  TZStatsOperation,
} from "lib/tzstats";
import { loadChainId } from "lib/thanos/helpers";
import { T } from "lib/i18n/react";
import {
  ThanosAssetType,
  ThanosAsset,
  XTZ_ASSET,
  useThanosClient,
  useNetwork,
  useOnStorageChanged,
  mutezToTz,
  isKnownChainId,
  ThanosToken,
  useChainId,
} from "lib/thanos/front";
import { TZKT_BASE_URLS } from "lib/tzkt";
import {
  BCD_NETWORKS_NAMES,
  BcdPageableTokenTransfers,
  BcdTokenTransfer,
  getTokenTransfers,
} from "lib/better-call-dev";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";
import Operation, {
  OperationPreview,
  InternalTransfer,
} from "app/templates/Operation";

const PNDOP_EXPIRE_DELAY = 1000 * 60 * 60 * 24;
const OPERATIONS_LIMIT = 30;

interface OperationHistoryProps {
  accountPkh: string;
  accountOwner?: string;
  asset?: ThanosAsset;
  className?: string;
}

const OperationHistory: React.FC<OperationHistoryProps> = ({
  accountPkh,
  accountOwner,
  asset,
  className,
}) => {
  const chainId = useChainId();
  const tzStatsNetwork = React.useMemo(
    () =>
      (chainId && isKnownChainId(chainId)
        ? TZSTATS_CHAINS.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  const networkId = React.useMemo(
    () =>
      (chainId && isKnownChainId(chainId)
        ? BCD_NETWORKS_NAMES.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  return (
    <div
      className={classNames(
        "w-full max-w-md mx-auto",
        "flex flex-col",
        className
      )}
    >
      {!asset || asset.type === ThanosAssetType.XTZ ? (
        <AllOperationsList
          accountPkh={accountPkh}
          accountOwner={accountOwner}
          tzStatsNetwork={tzStatsNetwork}
          networkId={networkId}
          xtzOnly={!!asset}
        />
      ) : (
        <TokenOperationsList
          accountPkh={accountPkh}
          accountOwner={accountOwner}
          asset={asset}
          tzStatsNetwork={tzStatsNetwork}
          networkId={networkId}
        />
      )}
    </div>
  );
};

export default OperationHistory;

type BaseOperationsListProps = {
  accountPkh: string;
  accountOwner?: string;
  tzStatsNetwork: TZStatsNetwork | null;
  networkId: "mainnet" | "carthagenet" | "delphinet" | null;
};

type AllOperationsListProps = BaseOperationsListProps & {
  xtzOnly?: boolean;
};

const AllOperationsList: React.FC<AllOperationsListProps> = ({
  accountPkh,
  accountOwner,
  tzStatsNetwork,
  networkId,
  xtzOnly,
}) => {
  const fetchOperations = React.useCallback(async () => {
    try {
      const { ops } = tzStatsNetwork
        ? await getAccountWithOperations(tzStatsNetwork, {
            pkh: accountPkh,
            order: "desc",
            limit: OPERATIONS_LIMIT,
            offset: 0,
          })
        : { ops: [] as TZStatsOperation[] };
      const tzStatsOps = ops.reduce<Record<string, TZStatsOperation[]>>(
        (newOps, op) => ({
          ...newOps,
          [op.hash]: [...(newOps[op.hash] || []), op],
        }),
        {}
      );

      let bcdOps: Record<string, BcdTokenTransfer[]> = {};
      const lastTzStatsOp = ops[ops.length - 1];
      if (networkId) {
        const {
          transfers,
        }: BcdPageableTokenTransfers = await getTokenTransfers({
          network: networkId,
          address: accountPkh,
          size: OPERATIONS_LIMIT,
        });
        bcdOps = transfers
          .filter((transfer) =>
            lastTzStatsOp
              ? new Date(transfer.timestamp) >= new Date(lastTzStatsOp.time)
              : true
          )
          .reduce<Record<string, BcdTokenTransfer[]>>(
            (newTransfers, transfer) => ({
              ...newTransfers,
              [transfer.hash]: [
                ...(newTransfers[transfer.hash] || []),
                transfer,
              ],
            }),
            {}
          );
      }

      return {
        bcdOps,
        tzStatsOps,
      };
    } catch (err) {
      if (err?.origin?.response?.status === 404) {
        return { bcdOps: {}, tzStatsOps: {} };
      }

      // Human delay
      await new Promise((r) => setTimeout(r, 300));
      throw err;
    }
  }, [tzStatsNetwork, accountPkh, networkId]);

  const { data } = useRetryableSWR(
    ["operation-history", tzStatsNetwork, accountPkh, networkId, xtzOnly],
    fetchOperations,
    {
      suspense: true,
      refreshInterval: 15_000,
      dedupingInterval: 10_000,
    }
  );

  return (
    <GenericOperationsList
      {...data!}
      accountPkh={accountPkh}
      accountOwner={accountOwner}
      asset={xtzOnly ? XTZ_ASSET : undefined}
      withExplorer={!!tzStatsNetwork}
    />
  );
};

type TokenOperationsListProps = BaseOperationsListProps & {
  asset: ThanosToken;
};

const TokenOperationsList: React.FC<TokenOperationsListProps> = ({
  accountPkh,
  accountOwner,
  asset,
  tzStatsNetwork,
  networkId,
}) => {
  const fetchOperations = React.useCallback(async () => {
    try {
      const { transfers: rawBcdOps } = networkId
        ? await getTokenTransfers({
            network: networkId,
            address: accountPkh,
            size: OPERATIONS_LIMIT,
            contracts: asset.address,
          })
        : { transfers: [] };
      const lastBcdOp = rawBcdOps[rawBcdOps.length - 1];
      const lastBcdOpTime = new Date(lastBcdOp?.timestamp || 0);
      const groupedBcdOps = rawBcdOps.reduce<
        Record<string, BcdTokenTransfer[]>
      >(
        (newTransfers, transfer) => ({
          ...newTransfers,
          [transfer.hash]: [...(newTransfers[transfer.hash] || []), transfer],
        }),
        {}
      );
      const tzStatsOps: TZStatsOperation[] = [];
      let shouldStopFetchBcdOperations = false;
      let i = 0;
      while (!shouldStopFetchBcdOperations && tzStatsNetwork) {
        const { ops } = await getAccountWithOperations(tzStatsNetwork, {
          pkh: accountPkh,
          order: "desc",
          limit: OPERATIONS_LIMIT,
          offset: OPERATIONS_LIMIT * i,
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

      return {
        bcdOps: groupedBcdOps,
        tzStatsOps: relevantGroupedTzStatsOps,
      };
    } catch (err) {
      if (err?.origin?.response?.status === 404) {
        return { bcdOps: {}, tzStatsOps: {} };
      }

      // Human delay
      await new Promise((r) => setTimeout(r, 300));
      throw err;
    }
  }, [accountPkh, networkId, asset.address, tzStatsNetwork]);

  const { data } = useRetryableSWR(
    ["operation-history", accountPkh, networkId, asset.address],
    fetchOperations,
    {
      suspense: true,
      refreshInterval: 15_000,
      dedupingInterval: 10_000,
    }
  );

  return (
    <GenericOperationsList
      {...data!}
      accountPkh={accountPkh}
      accountOwner={accountOwner}
      asset={asset}
      withExplorer={!!tzStatsNetwork}
    />
  );
};

type GroupedOperations = {
  bcdOps: Record<string, BcdTokenTransfer[]>;
  tzStatsOps: Record<string, TZStatsOperation[]>;
};

type GenericOperationsListProps = GroupedOperations & {
  accountPkh: string;
  accountOwner?: string;
  asset?: ThanosAsset;
  withExplorer: boolean;
};

const GenericOperationsList: React.FC<GenericOperationsListProps> = ({
  accountPkh,
  bcdOps,
  tzStatsOps,
  accountOwner,
  withExplorer,
  asset,
}) => {
  const { getAllPndOps, removePndOps } = useThanosClient();
  const network = useNetwork();

  const operations = React.useMemo<OperationPreview[]>(() => {
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
                    delegate:
                      op.type === "delegation" ? op.delegate : undefined,
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
  }, [bcdOps, tzStatsOps, asset]);

  const fetchPendingOperations = React.useCallback(async () => {
    const chainId = await loadChainId(network.rpcBaseURL);
    const sendPndOps = await getAllPndOps(accountPkh, chainId);
    const receivePndOps = accountOwner
      ? (await getAllPndOps(accountOwner, chainId)).filter(
          (op) => op.kind === "transaction" && op.destination === accountPkh
        )
      : [];
    return { pndOps: [...sendPndOps, ...receivePndOps], chainId };
  }, [getAllPndOps, network.rpcBaseURL, accountPkh, accountOwner]);

  const pndOpsSWR = useRetryableSWR(
    ["pndops", network.rpcBaseURL, accountPkh, accountOwner],
    fetchPendingOperations,
    { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  useOnStorageChanged(pndOpsSWR.revalidate);
  const { pndOps, chainId } = pndOpsSWR.data!;

  const pendingOperations = React.useMemo<OperationPreview[]>(
    () =>
      pndOps
        .map((op, index) => {
          const parameters = (op as any).parameters;
          let internalTransfers: InternalTransfer[] = [];
          let tokenAddress: string | undefined = undefined;
          if (op.kind === "transaction") {
            if (parameters?.entrypoint === "transfer") {
              internalTransfers = tryGetTransfers(parameters) || [];
              if (internalTransfers.length > 0) {
                tokenAddress = op.destination;
              }
            } else if (Number(op.amount || 0)) {
              internalTransfers = [
                {
                  volume: mutezToTz(op.amount),
                  receiver: op.destination,
                  sender: accountPkh,
                },
              ];
            }
          }

          return {
            ...op,
            // @ts-ignore
            counter: Number(op.counter || index),
            entrypoint: parameters?.entrypoint,
            hash: op.hash,
            type: op.kind,
            status: "pending",
            time: op.addedAt,
            internalTransfers: internalTransfers.map((transfer) => ({
              ...transfer,
              tokenAddress,
            })),
            rawReceiver: op.kind === "transaction" ? op.destination : undefined,
            volume:
              op.kind === "transaction" ? mutezToTz(op.amount).toNumber() : 0,
          };
        })
        .filter((op) => {
          if (!asset) return true;

          return asset.type === ThanosAssetType.XTZ
            ? op.volume > 0
            : op.internalTransfers[0]?.tokenAddress === asset.address;
        }),
    [pndOps, accountPkh, asset]
  );

  const [uniqueOps, nonUniqueOps] = React.useMemo(() => {
    const unique: OperationPreview[] = [];
    const nonUnique: OperationPreview[] = [];

    for (const pndOp of pendingOperations) {
      const expired =
        new Date(pndOp.time).getTime() + PNDOP_EXPIRE_DELAY < Date.now();

      if (expired || operations.some((op) => opKey(op) === opKey(pndOp))) {
        nonUnique.push(pndOp);
      } else if (unique.every((u) => opKey(u) !== opKey(pndOp))) {
        unique.push(pndOp);
      }
    }

    for (const op of operations) {
      if (unique.every((u) => opKey(u) !== opKey(op))) {
        unique.push(op);
      }
    }

    return [
      unique.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      ),
      nonUnique,
    ];
  }, [operations, pendingOperations]);

  React.useEffect(() => {
    if (nonUniqueOps.length > 0) {
      removePndOps(
        accountPkh,
        chainId,
        nonUniqueOps.map((o) => o.hash)
      );
    }
  }, [removePndOps, accountPkh, chainId, nonUniqueOps]);

  const explorerBaseUrl = React.useMemo(
    () =>
      (isKnownChainId(chainId) ? TZKT_BASE_URLS.get(chainId) : undefined) ??
      null,
    [chainId]
  );

  return (
    <>
      {uniqueOps.length === 0 && (
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
      )}

      {uniqueOps.map((op) => (
        <Operation
          key={opKey(op)}
          accountPkh={accountPkh}
          withExplorer={withExplorer}
          explorerBaseUrl={explorerBaseUrl}
          {...op}
        />
      ))}
    </>
  );
};

function opKey(op: OperationPreview) {
  return `${op.hash}_${op.type}_${op.counter}`;
}

function tryGetTransfers(parameters: any): InternalTransfer[] | null {
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
