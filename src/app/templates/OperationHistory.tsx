import { AxiosResponse } from "axios";
import * as React from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useRetryableSWR } from "lib/swr";
import { TZSTATS_CHAINS, getAccountWithOperations } from "lib/tzstats";
import { loadChainId } from "lib/thanos/helpers";
import { T } from "lib/i18n/react";
import {
  ThanosAssetType,
  XTZ_ASSET,
  useThanosClient,
  useNetwork,
  useAssets,
  useOnStorageChanged,
  mutezToTz,
  isKnownChainId,
  ThanosAsset,
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

const PNDOP_EXPIRE_DELAY = 1000 * 60 * 60 * 24;
const OPERATIONS_LIMIT = 30;

interface OperationPreview {
  hash: string;
  type: string;
  receiver: string;
  volume: number;
  status: string;
  time: string;
  parameters?: any;
  tokenAddress?: string;
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
      pndOps.map((op) => ({
        ...op,
        hash: op.hash,
        type: op.kind,
        receiver: op.kind === "transaction" ? op.destination : "",
        volume: op.kind === "transaction" ? mutezToTz(op.amount).toNumber() : 0,
        status: "pending",
        time: op.addedAt,
      })),
    [pndOps]
  );

  /**
   * Operation history from TZStats
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
      if (!tzStatsNetwork) return [];

      const { ops } = await getAccountWithOperations(tzStatsNetwork, {
        pkh: accountPkh,
        order: "desc",
        limit: OPERATIONS_LIMIT,
        offset: 0,
      });

      let bcdOps: Record<string, BcdTokenTransfer> = {};
      const lastTzStatsOp = ops[ops.length - 1];
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
        bcdOps = transfers
          .filter((transfer) =>
            lastTzStatsOp
              ? new Date(transfer.timestamp) >= new Date(lastTzStatsOp.time)
              : true
          )
          .reduce(
            (newTransfers, transfer) => ({
              ...newTransfers,
              [transfer.hash]: transfer,
            }),
            {}
          );
      }

      const tzStatsOpsWithReplacements = ops.map((op) => {
        const rawBcdData = bcdOps[op.hash];

        if (!rawBcdData) {
          return op;
        }

        delete bcdOps[op.hash];
        return {
          ...op,
          volume: rawBcdData.amount,
          tokenAddress: rawBcdData.contract,
          sender: rawBcdData.from,
          receiver: rawBcdData.to,
        };
      });

      return [
        ...tzStatsOpsWithReplacements,
        ...Object.values(bcdOps).map((bcdOp) => ({
          volume: bcdOp.amount,
          tokenAddress: bcdOp.contract,
          sender: bcdOp.from,
          receiver: bcdOp.to,
          hash: bcdOp.hash,
          status: bcdOp.status,
          time: bcdOp.timestamp,
          type: "transaction",
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

type OperationProps = OperationPreview & {
  accountPkh: string;
  withExplorer: boolean;
  explorerBaseUrl: string | null;
};

const Operation = React.memo<OperationProps>(
  ({
    accountPkh,
    withExplorer,
    explorerBaseUrl,
    hash,
    type,
    parameters,
    receiver,
    volume,
    status,
    time,
    tokenAddress: tokenAddressFromBcd,
  }) => {
    const { allAssets } = useAssets();

    const tokenAddress = tokenAddressFromBcd || (parameters && receiver);
    const token = React.useMemo(
      () =>
        (tokenAddress &&
          allAssets.find(
            (a) => a.type !== ThanosAssetType.XTZ && a.address === tokenAddress
          )) ||
        null,
      [allAssets, tokenAddress]
    );

    const parsedParameters = React.useMemo(() => {
      if (parameters && token && !tokenAddressFromBcd) {
        return tryParseParameters(token, parameters);
      }
      return null;
    }, [parameters, token, tokenAddressFromBcd]);

    const finalReceiver = parsedParameters
      ? parsedParameters.receiver
      : receiver;
    let finalVolume = volume;
    if (tokenAddressFromBcd) {
      finalVolume = new BigNumber(volume)
        .div(10 ** (token?.decimals || 0))
        .toNumber();
    }
    if (parsedParameters) {
      finalVolume = parsedParameters.volume;
    }

    const volumeExists = finalVolume !== 0;
    const typeTx = type === "transaction";
    const imReceiver = finalReceiver === accountPkh;
    const pending = withExplorer && status === "pending";
    const failed = ["failed", "backtracked", "skipped"].includes(status);

    return React.useMemo(
      () => (
        <div className={classNames("my-3", "flex items-stretch")}>
          <div className="mr-2">
            <Identicon hash={hash} size={50} className="shadow-xs" />
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
                <span className="mt-1 text-xs text-blue-600 opacity-75">
                  {formatOperationType(type, imReceiver)}
                </span>

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

              {volumeExists && !failed && (
                <div className="flex flex-col items-end flex-shrink-0">
                  <div
                    className={classNames(
                      "text-sm",
                      (() => {
                        switch (true) {
                          case pending:
                            return "text-yellow-600";

                          case typeTx:
                            return imReceiver
                              ? "text-green-500"
                              : "text-red-700";

                          default:
                            return "text-gray-800";
                        }
                      })()
                    )}
                  >
                    {typeTx && (imReceiver ? "+" : "-")}
                    <Money>{finalVolume}</Money>{" "}
                    {tokenAddress ? token?.symbol || "???" : "ꜩ"}
                  </div>

                  <InUSD volume={finalVolume} asset={token || XTZ_ASSET}>
                    {(usdVolume) => (
                      <div className="text-xs text-gray-500">
                        <span className="mr-px">$</span>
                        {usdVolume}
                      </div>
                    )}
                  </InUSD>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      [
        hash,
        finalVolume,
        imReceiver,
        pending,
        failed,
        status,
        time,
        token,
        type,
        typeTx,
        volumeExists,
        explorerBaseUrl,
        tokenAddress,
      ]
    );
  }
);

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
  if (type === "transaction") {
    type = `${imReciever ? "↓" : "↑"}_${type}`;
  }

  return type
    .split("_")
    .map((w) => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
    .join(" ");
}

function opKey(op: OperationPreview) {
  return `${op.hash}_${op.type}`;
}

function tryParseParameters(asset: ThanosAsset, parameters: any) {
  switch (asset.type) {
    case ThanosAssetType.Staker:
    case ThanosAssetType.TzBTC:
    case ThanosAssetType.FA1_2:
      try {
        if ("transfer" in parameters.value) {
          const {
            from: sender,
            to: receiver,
            value,
          } = parameters.value.transfer;
          const volume = new BigNumber(value)
            .div(10 ** asset.decimals)
            .toNumber();

          return {
            sender,
            receiver,
            volume,
          };
        } else {
          const [fromArgs, { args: toArgs }] = parameters.value.args;
          const sender: string = fromArgs.string;
          const receiver: string = toArgs[0].string;
          const volume = new BigNumber(toArgs[1].int)
            .div(10 ** asset.decimals)
            .toNumber();
          return {
            sender,
            receiver,
            volume,
          };
        }
      } catch (_err) {
        return null;
      }

    default:
      return null;
  }
}
