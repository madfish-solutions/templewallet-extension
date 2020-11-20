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
import { loadChainId } from "lib/thanos/helpers";
import { T } from "lib/i18n/react";
import {
  ThanosAssetType,
  XTZ_ASSET,
  useThanosClient,
  useNetwork,
  useOnStorageChanged,
  mutezToTz,
  isKnownChainId,
  ThanosAsset,
  ThanosXTZAsset,
  useAllAssetsRef,
} from "lib/thanos/front";
import { TZKT_BASE_URLS } from "lib/tzkt";
import {
  BcdOperationsSearchItem,
  BCD_NETWORKS_NAMES,
  searchOperations,
  SEARCH_PAGE_SIZE,
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

interface OperationPreview {
  delegate?: string;
  hash: string;
  type: string;
  sender: string;
  receiver: string;
  volume: number;
  status: string;
  time: string;
  parameters?: any;
  guessedTokenType?: ThanosAssetType.FA1_2 | ThanosAssetType.FA2;
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
        let guessedTokenType: OperationPreview["guessedTokenType"];
        if (
          parameters &&
          op.kind === "transaction" &&
          parameters.entrypoint === "transfer"
        ) {
          guessedTokenType =
            parameters.value instanceof Array
              ? ThanosAssetType.FA2
              : ThanosAssetType.FA1_2;
        }

        return {
          ...op,
          type: op.kind,
          receiver: op.kind === "transaction" ? op.destination : "",
          sender: accountPkh,
          volume:
            op.kind === "transaction" ? mutezToTz(op.amount).toNumber() : 0,
          status: "pending",
          time: op.addedAt,
          guessedTokenType,
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
      const { ops } = tzStatsNetwork
        ? await getAccountWithOperations(tzStatsNetwork, {
            pkh: accountPkh,
            order: "desc",
            limit: OPERATIONS_LIMIT,
            offset: 0,
          })
        : { ops: [] as TZStatsOperation[] };

      const bcdOps: Record<string, BcdOperationsSearchItem> = {};
      const lastTzStatsOp = ops[ops.length - 1];
      if (networkId) {
        const baseBcdSearchParams = {
          network: networkId,
          address: accountPkh,
          since: Math.floor(
            new Date(lastTzStatsOp?.time || 0).getTime() / 1000
          ),
        };
        let count = Infinity;
        for (let offset = 0; offset < count; offset += SEARCH_PAGE_SIZE) {
          const response = await searchOperations({
            ...baseBcdSearchParams,
            offset,
          });
          const {
            data: { count: newCount, items },
          } = response;
          count = newCount;
          items.forEach((item) => {
            const {
              body: { hash, kind, entrypoint, amount },
            } = item;
            if (
              kind === "transaction" &&
              entrypoint === "transfer" &&
              !amount
            ) {
              bcdOps[hash] = item;
            }
          });
        }
      }

      const tzStatsOpsWithReplacements = ops.map<OperationPreview>((op) => {
        const rawBcdData = bcdOps[op.hash];

        if (!rawBcdData) {
          return op;
        }

        delete bcdOps[op.hash];

        return searchItemToOperationPreview(rawBcdData);
      });

      return [
        ...tzStatsOpsWithReplacements,
        ...Object.values(bcdOps).map(searchItemToOperationPreview),
      ];
    } catch (err) {
      if (err?.origin?.response?.status === 404) {
        return [];
      }

      // Human delay
      await new Promise((r) => setTimeout(r, 300));
      throw err;
    }
  }, [tzStatsNetwork, accountPkh, networkId]);

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

export function searchItemToOperationPreview(
  item: BcdOperationsSearchItem
): OperationPreview {
  const {
    body: { hash, status, timestamp, destination, parameters, source, tags },
  } = item;

  return {
    status,
    hash,
    parameters,
    type: "transaction",
    time: timestamp,
    receiver: destination,
    sender: source,
    volume: 0,
    guessedTokenType: tags?.includes("fa12")
      ? ThanosAssetType.FA1_2
      : ThanosAssetType.FA2,
  };
}

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
    guessedTokenType,
    hash,
    type,
    parameters,
    sender,
    receiver,
    volume,
    status,
    time,
  }) => {
    const tokenAddress = volume ? undefined : parameters && receiver;

    const transfersFromParameters = React.useMemo(() => {
      if (parameters) {
        return tryParseParameters(
          guessedTokenType,
          typeof parameters === "string" ? JSON.parse(parameters) : parameters
        );
      }
      return null;
    }, [parameters, guessedTokenType]);

    const imReceiver = transfersFromParameters
      ? transfersFromParameters.some(
          (transfer) => transfer.receiver === accountPkh
        )
      : receiver === accountPkh;
    const relevantTokenTransfers = imReceiver
      ? transfersFromParameters?.filter(
          ({ receiver }) => receiver === accountPkh
        )
      : transfersFromParameters;

    const pending = withExplorer && status === "pending";
    const failed = ["failed", "backtracked", "skipped"].includes(status);
    const volumeExists = volume > 0;
    const hasTokenTransfers =
      relevantTokenTransfers && relevantTokenTransfers.length > 0;
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
        case type === "transaction" && receiver.startsWith("KT"):
          return "interaction";
        default:
          return type;
      }
    }, [isTransfer, receiver, type, delegate]);

    const receivers = React.useMemo(() => {
      switch (true) {
        case isSendingTransfer && hasTokenTransfers:
          const uniqueReceivers = new Set(
            relevantTokenTransfers!.map((transfer) => transfer.receiver)
          );
          return [...uniqueReceivers];
        case isSendingTransfer:
          return [receiver];
        default:
          return [];
      }
    }, [
      hasTokenTransfers,
      isSendingTransfer,
      receiver,
      relevantTokenTransfers,
    ]);

    const { iconHash, iconType } = React.useMemo<{
      iconHash: string;
      iconType: "bottts" | "jdenticon";
    }>(() => {
      switch (true) {
        case isSendingTransfer:
          return { iconHash: receivers[0], iconType: "bottts" };
        case isReceivingTransfer:
          return { iconHash: sender, iconType: "bottts" };
        case type === "delegation" && delegate:
          return { iconHash: delegate!, iconType: "bottts" };
        case moreExactType === "interaction":
          return { iconHash: receiver, iconType: "jdenticon" };
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
      receiver,
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
                <span className="font-light text-gray-500 text-xs">
                  <T
                    id="transferFromSmb"
                    substitutions={<HashChip type="link" hash={sender} />}
                  />
                </span>
              )}
              {isSendingTransfer && (
                <span className="text-xs text-blue-600 opacity-75">
                  <T
                    id="transferToSmb"
                    substitutions={receivers.map((receiver, index) => (
                      <>
                        <HashChip key={receiver} hash={receiver} type="link" />
                        {index === receivers.length - 1 ? null : ", "}
                      </>
                    ))}
                  />
                </span>
              )}
              {moreExactType === "interaction" && (
                <span className="font-light text-gray-500 text-xs">
                  <T
                    id="interactionWithContract"
                    substitutions={
                      <HashChip
                        type="link"
                        hash={receiver}
                        className="text-blue-600"
                      />
                    }
                  />
                </span>
              )}
              {moreExactType === "delegation" && (
                <span className="font-light text-gray-500 text-xs">
                  <T
                    id="delegationToSmb"
                    substitutions={
                      <HashChip
                        type="link"
                        hash={delegate!}
                        className="text-blue-600"
                      />
                    }
                  />
                </span>
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
                {hasTokenTransfers
                  ? relevantTokenTransfers!.map(
                      ({ tokenId, volume: tokenVolume }, index) => (
                        <OperationVolumeDisplay
                          key={index}
                          type={imReceiver ? "receive" : "send"}
                          tokenId={tokenId}
                          tokenAddress={tokenAddress}
                          pending={pending}
                          volume={tokenVolume}
                        />
                      )
                    )
                  : volumeExists && (
                      <OperationVolumeDisplay
                        type={(() => {
                          if (isTransfer) {
                            return isSendingTransfer ? "send" : "receive";
                          }
                          return "other";
                        })()}
                        pending={pending}
                        volume={new BigNumber(volume)}
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

type OperationVolumeDisplayProps = {
  type: "send" | "receive" | "other";
  tokenAddress?: string;
  tokenId?: number;
  pending: boolean;
  volume: BigNumber;
};

const OperationVolumeDisplay: React.FC<OperationVolumeDisplayProps> = (
  props
) => {
  const { type, tokenId, tokenAddress, pending, volume: rawVolume } = props;

  const allAssetsRef = useAllAssetsRef();
  const token = React.useMemo(
    () =>
      tokenAddress
        ? allAssetsRef.current.find(
            (a): a is Exclude<ThanosAsset, ThanosXTZAsset> =>
              a.type !== ThanosAssetType.XTZ &&
              a.address === tokenAddress &&
              (a.type !== ThanosAssetType.FA2 || tokenId === a.id)
          )
        : undefined,
    [allAssetsRef, tokenAddress, tokenId]
  );

  const volume = rawVolume.div(10 ** (token?.decimals || 0));
  const isTransaction = type !== "other";

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
        <Money>{volume}</Money> {tokenAddress ? token?.symbol || "???" : "ꜩ"}
      </div>

      {(!tokenAddress || token) && (
        <InUSD volume={volume} asset={token || XTZ_ASSET}>
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

type TransferFromParameters = {
  sender: string;
  receiver: string;
  volume: BigNumber;
  tokenId?: number;
};
function tryParseParameters(
  guessedTokenType: OperationPreview["guessedTokenType"],
  parameters: any
): TransferFromParameters[] | null {
  switch (guessedTokenType) {
    case ThanosAssetType.FA1_2:
      try {
        if ("transfer" in parameters.value) {
          const {
            from: sender,
            to: receiver,
            value,
          } = parameters.value.transfer;
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
    case ThanosAssetType.FA2:
      try {
        const parsedTransfers: TransferFromParameters[] = [];
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
      } catch (_err) {
        return null;
      }

    default:
      return null;
  }
}
