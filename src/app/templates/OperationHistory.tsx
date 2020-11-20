import { AxiosResponse } from "axios";
import * as React from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useRetryableSWR } from "lib/swr";
import {
  TZSTATS_CHAINS,
  getAccountWithOperations,
  TZStatsOperation,
} from "lib/tzstats";
import {
  getOperations as getTzktOperations,
  TzktOperation,
  TzktTransactionOperation,
} from "lib/tzkt";
import { loadChainId } from "lib/thanos/helpers";
import { T, TProps } from "lib/i18n/react";
import {
  ThanosAssetType,
  XTZ_ASSET,
  useThanosClient,
  useNetwork,
  useOnStorageChanged,
  mutezToTz,
  isKnownChainId,
  useAssets,
} from "lib/thanos/front";
import { TZKT_BASE_URLS } from "lib/tzkt";
import {
  BcdPageableTokenTransfers,
  BcdTokenTransfer,
  BCD_NETWORKS_NAMES,
  getTokenTransfers,
} from "lib/better-call-dev";
import InUSD from "app/templates/InUSD";
import HashChip from "app/templates/HashChip";
import Identicon from "app/atoms/Identicon";
import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import Money from "app/atoms/Money";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";
import { ReactComponent as ClipboardIcon } from "app/icons/clipboard.svg";

const PNDOP_EXPIRE_DELAY = 1000 * 60 * 60 * 24;
const OPERATIONS_LIMIT = 30;

interface InternalTransfer {
  volume: BigNumber;
  tokenId?: number;
  sender: string;
  receiver: string;
}

interface OperationPreview {
  rawReceiver?: string;
  delegate?: string;
  hash: string;
  type: string;
  status: string;
  time: string;
  tokenAddress?: string;
  internalTransfers: InternalTransfer[];
  volume: number;
}

interface OperationHistoryProps {
  accountPkh: string;
  accountOwner?: string;
}

const OperationHistory: React.FC<OperationHistoryProps> = ({
  accountPkh,
  accountOwner,
}) => {
  const { getAllPndOps, removePndOps } = useThanosClient();
  const network = useNetwork();

  /**
   * Pending operations
   */

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
      pndOps.map((op) => {
        const parameters = (op as any).parameters;
        let internalTransfers: InternalTransfer[] = [];
        let tokenAddress = undefined;
        if (op.kind === "transaction") {
          if (parameters?.entrypoint === "transfer") {
            internalTransfers = tryGetTransfers(parameters) || [];
            if (internalTransfers.length > 0) {
              tokenAddress = op.destination;
            }
          } else if (op.amount) {
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
          hash: op.hash,
          type: op.kind,
          status: "pending",
          time: op.addedAt,
          internalTransfers,
          tokenAddress,
          rawReceiver: op.kind === "transaction" ? op.destination : undefined,
          volume:
            op.kind === "transaction" ? mutezToTz(op.amount).toNumber() : 0,
        };
      }),
    [pndOps, accountPkh]
  );

  /**
   * Operation history from TZStats and BCD
   */

  const tzStatsNetwork = React.useMemo(
    () =>
      (isKnownChainId(chainId) ? TZSTATS_CHAINS.get(chainId) : undefined) ??
      null,
    [chainId]
  );

  const networkId = React.useMemo(
    () =>
      (isKnownChainId(chainId) ? BCD_NETWORKS_NAMES.get(chainId) : undefined) ??
      null,
    [chainId]
  );

  const fetchOperations = React.useCallback<
    () => Promise<OperationPreview[]>
  >(async () => {
    try {
      let tzStatsOps: TZStatsOperation[] = [];
      let tzktOps: TzktOperation[] = [];
      if (tzStatsNetwork) {
        try {
          const response = await getAccountWithOperations(tzStatsNetwork, {
            pkh: accountPkh,
            order: "desc",
            limit: OPERATIONS_LIMIT,
            offset: 0,
          });
          tzStatsOps = response.ops;
        } catch {
          if (isKnownChainId(chainId)) {
            tzktOps = await getTzktOperations(chainId, {
              address: accountPkh,
              limit: OPERATIONS_LIMIT,
            });
          }
        }
      }

      let bcdOps: Record<string, BcdTokenTransfer[]> = {};
      const lastTzStatsOp = tzStatsOps[tzStatsOps.length - 1];
      const lastTzktOp = tzktOps[tzktOps.length - 1];
      if (networkId) {
        const response: AxiosResponse<BcdPageableTokenTransfers> = await getTokenTransfers(
          {
            network: networkId,
            address: accountPkh,
            size: OPERATIONS_LIMIT,
          }
        );
        const {
          data: { transfers },
        } = response;
        const minDate =
          lastTzStatsOp || lastTzktOp
            ? new Date(
                Math.min(
                  lastTzStatsOp
                    ? new Date(lastTzStatsOp.time).getTime()
                    : Infinity,
                  lastTzktOp?.timestamp
                    ? new Date(lastTzktOp.timestamp).getTime()
                    : Infinity
                )
              )
            : new Date(0);
        bcdOps = transfers
          .filter((transfer) => {
            return new Date(transfer.timestamp) >= minDate;
          })
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

      const nonBcdOps = tzStatsOps.filter((op) => !bcdOps[op.hash]);
      const onlyTzktOps = tzktOps.filter(
        (rawOp) =>
          !bcdOps[rawOp.hash] &&
          !nonBcdOps.find(({ hash }) => hash === rawOp.hash) &&
          rawOp.status !== "backtracked"
      );

      return [
        ...nonBcdOps.map((op) => {
          const transfersFromParams =
            op.type === "transaction" &&
            (op.parameters as any)?.entrypoint === "transfer"
              ? tryGetTransfers(op.parameters)
              : null;
          const transfersFromVolumeProp =
            op.type === "transaction" && !op.parameters && op.volume
              ? [
                  {
                    volume: new BigNumber(op.volume),
                    sender: op.sender,
                    receiver: op.receiver,
                  },
                ]
              : [];
          return {
            delegate: op.type === "delegation" ? op.delegate : undefined,
            internalTransfers: transfersFromParams || transfersFromVolumeProp,
            hash: op.hash,
            status: op.status,
            time: op.time,
            type: op.type,
            volume: op.volume,
            rawReceiver: op.receiver,
            tokenAddress: transfersFromParams ? op.receiver : undefined,
          };
        }),
        ...onlyTzktOps.map((op) => {
          let transfersFromParams: InternalTransfer[] | null = null;
          if (op.type === "transaction" && op.parameters) {
            try {
              const parsedParams = JSON.parse(op.parameters);
              transfersFromParams =
                parsedParams?.entrypoint === "transfer"
                  ? tryGetTransfers(parsedParams)
                  : null;
            } catch {}
          }
          const transfersFromVolumeProp =
            op.type === "transaction" && !op.parameters && op.amount
              ? [
                  {
                    volume: mutezToTz(op.amount),
                    sender: op.sender.address,
                    receiver: op.target.address,
                  },
                ]
              : [];
          return {
            delegate:
              op.type === "delegation" ? op.newDelegate?.address : undefined,
            internalTransfers: transfersFromParams || transfersFromVolumeProp,
            hash: op.hash,
            status: op.status,
            time: op.timestamp || new Date().toISOString(),
            type: op.type,
            volume:
              op.type === "transaction" || op.type === "delegation"
                ? mutezToTz(op.amount).toNumber()
                : 0,
            rawReceiver:
              op.type === "transaction" ? op.target.address : undefined,
            tokenAddress: transfersFromParams
              ? (op as TzktTransactionOperation).target.address
              : undefined,
          };
        }),
        ...Object.values(bcdOps).map((bcdOpsChunk) => ({
          internalTransfers: bcdOpsChunk.map((bcdOp) => ({
            volume: new BigNumber(bcdOp.amount),
            tokenId: bcdOp.token_id,
            sender: bcdOp.from,
            receiver: bcdOp.to,
          })),
          tokenAddress: bcdOpsChunk[0].contract,
          hash: bcdOpsChunk[0].hash,
          status: bcdOpsChunk[0].status,
          time: bcdOpsChunk[0].timestamp,
          type: "transaction",
          volume: 0,
        })),
      ];
    } catch (err) {
      if (err?.origin?.response?.status === 404) {
        return [];
      }

      // Human delay
      await new Promise((r) => setTimeout(r, 300));
      throw err;
    }
  }, [tzStatsNetwork, accountPkh, networkId, chainId]);

  const { data } = useRetryableSWR(
    ["operation-history", tzStatsNetwork, accountPkh, networkId],
    fetchOperations,
    {
      suspense: true,
      refreshInterval: 15_000,
      dedupingInterval: 10_000,
    }
  );
  const operations = data!;

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

  const withExplorer = Boolean(tzStatsNetwork);
  const explorerBaseUrl = React.useMemo(
    () =>
      (isKnownChainId(chainId) ? TZKT_BASE_URLS.get(chainId) : undefined) ??
      null,
    [chainId]
  );

  return (
    <div
      className={classNames("mt-8", "w-full max-w-md mx-auto", "flex flex-col")}
    >
      {uniqueOps.length === 0 && (
        <div
          className={classNames(
            "mb-12",
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
    </div>
  );
};

export default OperationHistory;

type OperationProps = OperationPreview & {
  accountPkh: string;
  withExplorer: boolean;
  explorerBaseUrl: string | null;
};

const Operation = React.memo<OperationProps>(
  ({
    accountPkh,
    delegate,
    withExplorer,
    explorerBaseUrl,
    hash,
    rawReceiver,
    type,
    status,
    time,
    internalTransfers,
    tokenAddress,
    volume,
  }) => {
    const imReceiver = internalTransfers.some(
      ({ receiver }) => receiver === accountPkh
    );
    const pending = withExplorer && status === "pending";
    const failed = ["failed", "backtracked", "skipped"].includes(status);
    const volumeExists = volume > 0;
    const hasTokenTransfers = tokenAddress && internalTransfers.length > 0;
    const sender = internalTransfers[0]?.sender;
    const isTransfer =
      hasTokenTransfers || (volumeExists && type === "transaction");
    const isSendingTransfer = isTransfer && !imReceiver;
    const isReceivingTransfer = isTransfer && imReceiver;
    const moreExactType = React.useMemo(() => {
      switch (true) {
        case isTransfer:
          return "transfer";
        case type === "delegation":
          return delegate ? "delegation" : "undelegation";
        case type === "transaction" &&
          !!rawReceiver &&
          rawReceiver.startsWith("KT"):
          return "interaction";
        default:
          return type;
      }
    }, [isTransfer, rawReceiver, type, delegate]);

    const receivers = React.useMemo(() => {
      const uniqueReceivers = new Set(
        internalTransfers.map((transfer) => transfer.receiver)
      );
      return [...uniqueReceivers];
    }, [internalTransfers]);

    const { iconHash, iconType } = React.useMemo<{
      iconHash: string;
      iconType: "bottts" | "jdenticon";
    }>(() => {
      switch (true) {
        case isSendingTransfer:
          return { iconHash: receivers[0], iconType: "bottts" };
        case isReceivingTransfer:
          return { iconHash: sender, iconType: "bottts" };
        case type === "delegation" && !!delegate:
          return { iconHash: delegate!, iconType: "bottts" };
        case moreExactType === "interaction":
          return { iconHash: rawReceiver!, iconType: "jdenticon" };
        default:
          return { iconHash: hash, iconType: "jdenticon" };
      }
    }, [
      delegate,
      hash,
      type,
      moreExactType,
      isReceivingTransfer,
      receivers,
      isSendingTransfer,
      rawReceiver,
      sender,
    ]);

    return (
      <div className={classNames("my-3", "flex items-stretch")}>
        <div className="mr-2">
          <Identicon
            hash={iconHash}
            type={iconType}
            size={50}
            className="shadow-xs"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center">
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

          <div className="flex items-stretch">
            <div className="flex flex-col">
              <div className="flex items-center mt-1 text-xs text-blue-600 opacity-75">
                {formatOperationType(moreExactType, imReceiver)}
              </div>
              {isReceivingTransfer && (
                <OperationArgumentDisplay
                  i18nKey="transferFromSmb"
                  arg={[sender]}
                />
              )}
              {isSendingTransfer && (
                <OperationArgumentDisplay
                  i18nKey="transferToSmb"
                  arg={receivers}
                />
              )}
              {moreExactType === "interaction" && (
                <OperationArgumentDisplay
                  i18nKey="interactionWithContract"
                  arg={[rawReceiver!]}
                />
              )}
              {moreExactType === "delegation" && (
                <OperationArgumentDisplay
                  i18nKey="delegationToSmb"
                  arg={[delegate!]}
                />
              )}

              {(() => {
                const timeNode = (
                  <Time
                    children={() => (
                      <span className="text-xs font-light text-gray-500">
                        {formatDistanceToNow(new Date(time), {
                          includeSeconds: true,
                          addSuffix: true,
                          // @TODO Add dateFnsLocale
                          // locale: dateFnsLocale,
                        })}
                      </span>
                    )}
                  />
                );

                switch (true) {
                  case failed:
                    return (
                      <div className="flex items-center">
                        <T id={status}>
                          {(message) => (
                            <span className="mr-1 text-xs font-light text-red-700">
                              {message}
                            </span>
                          )}
                        </T>

                        {timeNode}
                      </div>
                    );

                  case pending:
                    return (
                      <T id="pending">
                        {(message) => (
                          <span className="text-xs font-light text-yellow-600">
                            {message}
                          </span>
                        )}
                      </T>
                    );

                  default:
                    return timeNode;
                }
              })()}
            </div>

            <div className="flex-1" />

            {!failed && (
              <div className="flex flex-col items-end flex-shrink-0">
                {internalTransfers.map((transfer, index) => (
                  <OperationVolumeDisplay
                    accountPkh={accountPkh}
                    key={index}
                    tokenAddress={tokenAddress}
                    transfer={transfer}
                    pending={pending}
                    volume={0}
                  />
                ))}
                {internalTransfers.length === 0 && (volume || undefined) && (
                  <OperationVolumeDisplay
                    accountPkh={accountPkh}
                    pending={pending}
                    volume={volume}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

type OperationArgumentDisplayProps = {
  i18nKey: TProps["id"];
  arg: string[];
};

const OperationArgumentDisplay = React.memo<OperationArgumentDisplayProps>(
  ({ i18nKey, arg }) => (
    <span className="font-light text-gray-500 text-xs">
      <T
        id={i18nKey}
        substitutions={arg.map((value, index) => (
          <>
            <HashChip
              className="text-blue-600 opacity-75"
              key={index}
              hash={value}
              type="link"
            />
            {index === arg.length - 1 ? null : ", "}
          </>
        ))}
      />
    </span>
  )
);

type OperationVolumeDisplayProps = {
  accountPkh: string;
  tokenAddress?: string;
  transfer?: InternalTransfer;
  pending: boolean;
  volume: number;
};

const OperationVolumeDisplay: React.FC<OperationVolumeDisplayProps> = (
  props
) => {
  const { accountPkh, tokenAddress, pending, transfer, volume } = props;

  const { allAssets } = useAssets();
  const token = React.useMemo(() => {
    if (!transfer || !tokenAddress) {
      return undefined;
    }
    return allAssets.find((asset) => {
      return (
        asset.type !== ThanosAssetType.XTZ &&
        asset.address === tokenAddress &&
        (asset.type !== ThanosAssetType.FA2 || asset.id === transfer.tokenId)
      );
    });
  }, [allAssets, transfer, tokenAddress]);

  const finalVolume = transfer
    ? transfer.volume.div(10 ** (token?.decimals || 0))
    : volume;
  const type = React.useMemo(() => {
    if (transfer) {
      return transfer.receiver === accountPkh ? "receive" : "send";
    }
    return "other";
  }, [accountPkh, transfer]);
  const isTransaction = type === "receive" || type === "send";

  return (
    <>
      <div
        className={classNames(
          "text-sm",
          (() => {
            switch (true) {
              case pending:
                return "text-yellow-600";

              case isTransaction:
                return type === "receive" ? "text-green-500" : "text-red-700";

              default:
                return "text-gray-800";
            }
          })()
        )}
      >
        {isTransaction && (type === "receive" ? "+" : "-")}
        <Money>{finalVolume}</Money>{" "}
        {tokenAddress ? token?.symbol || "???" : "ꜩ"}
      </div>

      {(!tokenAddress || token) && (
        <InUSD volume={finalVolume} asset={token || XTZ_ASSET}>
          {(usdVolume) => (
            <div className="text-xs text-gray-500">
              <span className="mr-px">$</span>
              {usdVolume}
            </div>
          )}
        </InUSD>
      )}
    </>
  );
};

type TimeProps = {
  children: () => React.ReactElement;
};

const Time: React.FC<TimeProps> = ({ children }) => {
  const [value, setValue] = React.useState(children);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setValue(children());
    }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [setValue, children]);

  return value;
};

function formatOperationType(type: string, imReciever: boolean) {
  if (type === "transaction" || type === "transfer") {
    type = `${imReciever ? "↓" : "↑"}_${type}`;
  }

  const operationTypeText = type
    .split("_")
    .map((w) => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
    .join(" ");

  return (
    <>
      {type === "interaction" && (
        <ClipboardIcon className="mr-1 h-3 w-auto stroke-current inline align-text-top" />
      )}
      {operationTypeText}
    </>
  );
}

function opKey(op: OperationPreview) {
  return `${op.hash}_${op.type}`;
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
