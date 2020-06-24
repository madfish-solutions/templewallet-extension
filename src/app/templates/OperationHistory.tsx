import * as React from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useRetryableSWR } from "lib/swr";
import { getAccountWithOperations } from "lib/tzstats";
import {
  ThanosAsset,
  ThanosAssetType,
  XTZ_ASSET,
  useNetwork,
  usePendingOperations,
  useAssets,
} from "lib/thanos/front";
import InUSD from "app/templates/InUSD";
import Identicon from "app/atoms/Identicon";
import HashChip from "app/atoms/HashChip";
import Money from "app/atoms/Money";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";

const PNDOP_EXPIRE_DELAY = 1000 * 60 * 60 * 24;

interface OperationPreview {
  hash: string;
  type: string;
  receiver: string;
  volume: number;
  status: string;
  time: string;
  parameters?: any;
}

interface OperationHistoryProps {
  accountPkh: string;
}

const OperationHistory: React.FC<OperationHistoryProps> = ({ accountPkh }) => {
  const network = useNetwork();
  const { pndOps, removePndOps } = usePendingOperations();

  const fetchOperations = React.useCallback(async () => {
    try {
      if (!network.tzStats) return [];

      const { ops } = await getAccountWithOperations(network.tzStats, {
        pkh: accountPkh,
        order: "desc",
        limit: 25,
        offset: 0,
      });
      return ops;
    } catch (err) {
      if (err?.origin?.response?.status === 404) {
        return [];
      }

      // Human delay
      await new Promise((r) => setTimeout(r, 300));
      throw err;
    }
  }, [network.tzStats, accountPkh]);

  const { data } = useRetryableSWR(
    ["operation-history", network.tzStats, accountPkh],
    fetchOperations,
    {
      suspense: true,
      refreshInterval: 15_000,
      dedupingInterval: 10_000,
    }
  );
  const operations = data!;

  const pendingOperations = React.useMemo<OperationPreview[]>(
    () =>
      pndOps.map((op) => ({
        hash: op.hash,
        type: op.kind,
        receiver: op.destination ?? "",
        volume: op.amount ?? 0,
        status: "backtracked",
        time: op.addedAt,
      })),
    [pndOps]
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
      removePndOps(nonUniqueOps);
    }
  }, [removePndOps, nonUniqueOps]);

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
          <LayersIcon className="mb-2 w-16 h-auto stroke-current" />

          <h3
            className="text-sm font-light text-center"
            style={{ maxWidth: "20rem" }}
          >
            {network.tzStats ? (
              "No operations found"
            ) : (
              <>
                Operation history is not available
                <br />
                for local sandbox
              </>
            )}
          </h3>
        </div>
      )}

      {uniqueOps.map((op) => (
        <Operation key={opKey(op)} accountPkh={accountPkh} {...op} />
      ))}
    </div>
  );
};

export default OperationHistory;

type OperationProps = OperationPreview & {
  accountPkh: string;
};

const Operation = React.memo<OperationProps>(
  ({ accountPkh, hash, type, receiver, volume, status, time, parameters }) => {
    const { allAssets } = useAssets();

    const token = React.useMemo(
      () =>
        (parameters &&
          allAssets.find(
            (a) => a.type !== ThanosAssetType.XTZ && a.address === receiver
          )) ||
        null,
      [allAssets, parameters, receiver]
    );

    const tokenParsed = React.useMemo(
      () => token && tryParseParameters(token, parameters),
      [token, parameters]
    );

    const finalReceiver = tokenParsed ? tokenParsed.receiver : receiver;
    const finalVolume = tokenParsed ? tokenParsed.volume : volume;

    const volumeExists = finalVolume !== 0;
    const typeTx = type === "transaction";
    const imReceiver = finalReceiver === accountPkh;
    const pending = status === "backtracked";

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

              <div className={classNames("flex-1", "h-px", "bg-gray-200")} />
            </div>

            <div className="flex items-stretch">
              <div className="flex flex-col">
                <span className="mt-1 text-xs text-blue-600 opacity-75">
                  {formatOperationType(type, imReceiver)}
                </span>

                {pending ? (
                  <span className="text-xs text-yellow-600 font-light">
                    pending...
                  </span>
                ) : (
                  <Time
                    children={() => (
                      <span className="text-xs text-gray-500 font-light">
                        {formatDistanceToNow(new Date(time), {
                          includeSeconds: true,
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  />
                )}
              </div>

              <div className="flex-1" />

              {volumeExists && (
                <div className="flex-shrink-0 flex flex-col items-end">
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
        time,
        token,
        type,
        typeTx,
        volumeExists,
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
        const args = parameters.value.transfer;
        const sender = args["0@address"] as string;
        const receiver = args["1@address"] as string;
        const volume = new BigNumber(args["2@nat"])
          .div(10 ** asset.decimals)
          .toNumber();
        return {
          sender,
          receiver,
          volume,
        };
      } catch (_err) {
        return null;
      }

    default:
      return null;
  }
}
