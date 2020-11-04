import { OpKind } from "@taquito/rpc";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useRetryableSWR } from "lib/swr";
import { TZSTATS_CHAINS } from "lib/tzstats";
import { loadChainId } from "lib/thanos/helpers";
import { T } from "lib/i18n/react";
import {
  BcdPageableTokenTransfers,
  BcdTokenTransfer,
  getTokenTransfers,
  isBcdSupportedNetwork,
} from "lib/better-call-dev";
import {
  getOperations,
  isDelegation,
  isTransaction,
  isTzktSupportedNetwork,
  TzktOperation,
} from "lib/tzkt";
import {
  ThanosAsset,
  ThanosAssetType,
  XTZ_ASSET,
  useThanosClient,
  useNetwork,
  useAssets,
  useOnStorageChanged,
} from "lib/thanos/front";
import useTippy from "lib/ui/useTippy";
import InUSD from "app/templates/InUSD";
import Identicon from "app/atoms/Identicon";
import HashChip from "app/templates/HashChip";
import Money from "app/atoms/Money";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";
import { ReactComponent as ArrowRightTopIcon } from "app/icons/arrow-right-top.svg";
import useInfiniteList from "lib/useInfiniteList";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import {
  hasAmount,
  hasReceiver,
  isTokenTransaction,
  isTzktTransaction,
  ThanosHistoricalOperation,
  ThanosHistoricalTokenTransaction,
  ThanosHistoricalTzktOperation,
  ThanosOperation,
  ThanosPendingOperation,
} from "lib/thanos/types";

const PNDOP_EXPIRE_DELAY = 1000 * 60 * 60 * 24;
const TZKT_BASE_URLS = new Map([
  ["NetXdQprcVkpaWU", "https://tzkt.io"],
  ["NetXjD3HPJJjmcd", "https://carthage.tzkt.io"],
  ["NetXm8tYqnMWky1", "https://delphi.tzkt.io"],
]);

type OperationHistoryProps = {
  accountPkh: string;
  accountOwner?: string;
};

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

  /**
   * Operation history from TZStats
   */

  const tzStatsNetwork = React.useMemo(
    () => TZSTATS_CHAINS.get(chainId) ?? null,
    [chainId]
  );

  const bcdOperationsGetKey = useCallback(
    (index: number, previousPageData: BcdPageableTokenTransfers | null) => {
      if (!previousPageData) {
        return `bcdOperations,${network.id},${accountPkh}`;
      }

      if (previousPageData.last_id) {
        return `bcdOperations,${network.id},${accountPkh},${previousPageData.last_id}`;
      }

      return null;
    },
    [network.id, accountPkh]
  );

  const tzktOperationsGetKey = useCallback(
    (index: number, previousOperations: TzktOperation[] | null) => {
      if (!previousOperations) {
        return `tzktOperations,${network.id},${accountPkh}`;
      }

      if (previousOperations.length === 0) {
        return null;
      }

      return `tzktOperations,${network.id},${accountPkh},${
        previousOperations[previousOperations.length - 1].id
      }`;
    },
    [network.id, accountPkh]
  );

  const {
    result: bcdOperations,
    error: bcdError,
    isLoadingMore: isLoadingMoreBcdOperations,
    isReachingEnd: isReachingBcdOperationsEnd,
    loadMore: loadMoreBcdOperations,
    isRefreshing: isRefreshingBcdOperations,
  } = useInfiniteList({
    additionalConfig: { refreshInterval: 15000 },
    getDataLength: bcdGetDataLength,
    getKey: bcdOperationsGetKey,
    fetcher: bcdOperationsFetcher,
    transformFn: bcdOperationsTransformFn,
    itemsPerPage: 10,
  });

  const {
    result: tzktOperations,
    error: tzktError,
    isLoadingMore: isLoadingMoreTzktOperations,
    isReachingEnd: isReachingTzktOperationsEnd,
    loadMore: loadMoreTzktOperations,
    isRefreshing: isRefreshingTzktOperations,
  } = useInfiniteList({
    additionalConfig: { refreshInterval: 15000 },
    getDataLength: tzktGetDataLength,
    getKey: tzktOperationsGetKey,
    fetcher: tzktOperationsFetcher,
    transformFn: tzktOperationsTransformFn,
    itemsPerPage: 10,
  });

  const getOperationsError = bcdError || tzktError;
  const isLoadingMore =
    isLoadingMoreBcdOperations || isLoadingMoreTzktOperations;
  const isReachingEnd =
    isReachingBcdOperationsEnd && isReachingTzktOperationsEnd;
  const isRefreshing = isRefreshingBcdOperations || isRefreshingTzktOperations;
  const loadMore = useCallback(() => {
    if (!isReachingTzktOperationsEnd) {
      loadMoreTzktOperations();
    }
    if (!isReachingBcdOperationsEnd) {
      loadMoreBcdOperations();
    }
  }, [
    isReachingTzktOperationsEnd,
    isReachingBcdOperationsEnd,
    loadMoreBcdOperations,
    loadMoreTzktOperations,
  ]);

  const operations = useMemo<ThanosHistoricalOperation[]>(() => {
    return [
      ...bcdOperations.map<ThanosHistoricalTokenTransaction>(
        ({ contract, hash, to, source, amount, status, timestamp }) => ({
          contract: contract,
          hash: hash,
          type: "transaction",
          receiver: to,
          sender: source,
          amount: amount,
          status: status,
          time: timestamp,
          isThanosPending: false,
        })
      ),
      ...tzktOperations
        .filter((operation) => {
          if (!isTransaction(operation)) {
            return true;
          }

          const parsedParams =
            operation.parameters &&
            tryParseParameters(null, operation.parameters);
          return !parsedParams || isTransferParameters(parsedParams);
        })
        .map<ThanosHistoricalTzktOperation>((operation) => {
          const {
            bakerFee,
            errors,
            gasLimit,
            gasUsed,
            hash,
            type,
            status,
            sender,
            timestamp,
          } = operation;
          const baseProps = {
            bakerFee,
            errors,
            gasLimit,
            gasUsed,
            hash,
            type,
            status,
            sender: sender.address,
            time: timestamp || new Date().toISOString(),
            isThanosPending: false as const,
          };

          if (isTransaction(operation)) {
            const {
              parameters,
              amount,
              initiator,
              storageFee,
              storageLimit,
              storageUsed,
              allocationFee,
              target,
            } = operation;

            return {
              ...baseProps,
              parameters: parameters,
              amount: amount,
              initiator: initiator,
              storageFee: storageFee,
              storageLimit: storageLimit,
              storageUsed: storageUsed,
              allocationFee: allocationFee,
              receiver: target.address,
              type: "transaction",
            };
          }

          if (isDelegation(operation)) {
            const { amount, initiator, prevDelegate, newDelegate } = operation;

            return {
              ...baseProps,
              amount: amount,
              initiator: initiator,
              prevDelegate: prevDelegate,
              newDelegate: newDelegate,
              type: "delegation",
            };
          }

          return {
            ...baseProps,
            type: "reveal",
          };
        }),
    ];
  }, [bcdOperations, tzktOperations]);

  useEffect(() => {
    if (getOperationsError) {
      throw getOperationsError;
    }
  }, [getOperationsError]);

  type t1 = keyof ThanosPendingOperation;
  const pendingOperations = useMemo<ThanosPendingOperation[]>(
    () =>
      pndOps.map((op) => ({
        isThanosPending: true,
        hash: op.hash,
        type: op.kind,
        sender: accountPkh,
        receiver: op.kind === OpKind.TRANSACTION ? op.destination : "",
        amount: +(op.kind === OpKind.TRANSACTION ? op.amount : "0"),
        status: "backtracked",
        parameters: "",
        time: op.addedAt,
      })),
    [pndOps, accountPkh]
  );

  const [uniqueOps, nonUniqueOps] = useMemo(() => {
    const unique: ThanosOperation[] = [];
    const nonUnique: ThanosOperation[] = [];

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

  useEffect(() => {
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
    () => TZKT_BASE_URLS.get(chainId) ?? null,
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
          operation={op}
        />
      ))}

      {!getOperationsError && (
        <div className="w-full flex justify-center py-4">
          <FormSecondaryButton
            disabled={isRefreshing || isLoadingMore || isReachingEnd}
            loading={isRefreshing || isLoadingMore}
            onClick={loadMore}
          >
            {isReachingEnd ? "There are no more items" : "Load more"}
          </FormSecondaryButton>
        </div>
      )}
    </div>
  );
};

export default OperationHistory;

function bcdGetDataLength(pageData: BcdPageableTokenTransfers) {
  return pageData.transfers.length;
}

async function bcdOperationsFetcher(queryKey: string) {
  const { networkId, accountPkh, lastId } = parseOperationsFetcherQueryKey(
    queryKey
  );
  if (!isBcdSupportedNetwork(networkId)) {
    return { transfers: [] };
  }

  return getTokenTransfers({
    address: accountPkh,
    network: networkId,
    last_id: lastId,
  });
}

function bcdOperationsTransformFn(pagesData: BcdPageableTokenTransfers[]) {
  return pagesData.reduce(
    (operations, { transfers }) => [...operations, ...transfers],
    [] as BcdTokenTransfer[]
  );
}

function tzktGetDataLength(pageData: TzktOperation[]) {
  return pageData.length;
}

async function tzktOperationsFetcher(queryKey: string) {
  const { networkId, accountPkh, lastId } = parseOperationsFetcherQueryKey(
    queryKey
  );
  if (!isTzktSupportedNetwork(networkId)) {
    return [];
  }

  return getOperations(networkId, {
    address: accountPkh,
    lastId: lastId !== undefined ? Number(lastId) : undefined,
    limit: 10,
  });
}

function tzktOperationsTransformFn(pagesData: TzktOperation[][]) {
  return pagesData.reduce(
    (resultPart, pageData) => [...resultPart, ...pageData],
    [] as TzktOperation[]
  );
}

function parseOperationsFetcherQueryKey(queryKey: string) {
  const [queryName, networkId, accountPkh, lastId] = queryKey.split(",");

  return {
    queryName,
    networkId,
    accountPkh,
    lastId,
  };
}

type OperationProps = {
  operation: ThanosOperation;
  accountPkh: string;
  withExplorer: boolean;
  explorerBaseUrl: string | null;
};

const Operation = React.memo<OperationProps>(
  ({ accountPkh, operation, withExplorer, explorerBaseUrl }) => {
    const { hash, type, status, time } = operation;
    const parameters = isTzktTransaction(operation)
      ? operation.parameters
      : undefined;
    const contractAddress = isTokenTransaction(operation)
      ? operation.contract
      : undefined;
    const receiver = hasReceiver(operation) ? operation.receiver : undefined;
    const amount = (hasAmount(operation) && operation.amount) || 0;
    const { allAssets } = useAssets();

    const token = useMemo(
      () =>
        (parameters &&
          allAssets.find(
            (a) =>
              a.type !== ThanosAssetType.XTZ && a.address === contractAddress
          )) ||
        null,
      [allAssets, parameters, contractAddress]
    );

    const tokenParsed = useMemo(
      () =>
        (parameters &&
          (tryParseParameters(
            token,
            parameters
          ) as ParsedTransferParameters)) ||
        null,
      [token, parameters]
    );

    const finalReceiver =
      contractAddress && tokenParsed ? tokenParsed.receiver : receiver;
    const finalVolume = tokenParsed
      ? tokenParsed.volume
      : contractAddress
      ? amount
      : new BigNumber(amount).div(1e6).toNumber();

    const volumeExists = finalVolume !== 0;
    const typeTx = type === "transaction";
    const imReceiver = finalReceiver === accountPkh;
    const pending = withExplorer && status === "pending";
    const failed = ["failed", "backtracked", "skipped"].includes(status);

    return useMemo(
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
                    <Money>{finalVolume}</Money> {token ? token.symbol : "ꜩ"}
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
      ]
    );
  }
);

type OpenInExplorerChipProps = {
  baseUrl: string;
  opHash: string;
  className?: string;
};

const OpenInExplorerChip: React.FC<OpenInExplorerChipProps> = ({
  baseUrl,
  opHash,
  className,
}) => {
  const tippyProps = React.useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: "View on block explorer",
      animation: "shift-away-subtle",
    }),
    []
  );

  const ref = useTippy<HTMLAnchorElement>(tippyProps);

  return (
    <a
      ref={ref}
      href={`${baseUrl}/${opHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames(
        "bg-gray-100 hover:bg-gray-200",
        "rounded-sm shadow-xs",
        "text-xs p-1",
        "text-gray-600 leading-none select-none",
        "transition ease-in-out duration-300",
        "flex items-center",
        className
      )}
    >
      <ArrowRightTopIcon className="w-auto h-3 stroke-current stroke-2" />
    </a>
  );
};

type TimeProps = {
  children: () => React.ReactElement;
};

const Time: React.FC<TimeProps> = ({ children }) => {
  const [value, setValue] = useState(children);

  useEffect(() => {
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

function opKey(op: ThanosOperation) {
  return `${op.hash}_${op.type}`;
}

type ParsedTransferParameters = {
  sender: string;
  receiver: string;
  volume: number;
  entrypoint: "transfer";
};
type ParsedNonTransferParameters = { entrypoint: string; [key: string]: any };
type ParsedParameters = ParsedTransferParameters | ParsedNonTransferParameters;

function isTransferParameters(
  parameters: ParsedParameters
): parameters is ParsedTransferParameters {
  return parameters.entrypoint === "transfer";
}

function tryParseParameters(
  asset: ThanosAsset | null,
  parameters: string
): ParsedParameters | null {
  try {
    const parsedParameters = JSON.parse(parameters);
    if (
      typeof parsedParameters !== "object" ||
      parsedParameters instanceof Array
    ) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "cannot process parameters ",
          parsedParameters,
          " for now"
        );
      }

      return null;
    }

    if (parsedParameters.entrypoint !== "transfer") {
      return parsedParameters;
    }

    const { args } = parsedParameters.value;
    const firstArgIsSender = !!args[0].string;
    const volumeArg = firstArgIsSender ? args[1].args[1] : args[1];
    const senderArg = firstArgIsSender ? args[0] : args[0].args[0];
    const receiverArg = firstArgIsSender ? args[1].args[0] : args[0].args[1];
    const receiver: string = receiverArg.string;
    const sender: string = senderArg.string;
    const volume = new BigNumber(volumeArg.int)
      .div(10 ** (asset?.decimals || 0))
      .toNumber();
    return { sender, receiver, volume, entrypoint: "transfer" };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error while parsing parameters ", parameters);
      console.error(e);
    }

    return null;
  }
}
