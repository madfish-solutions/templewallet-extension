import * as React from "react";
import classNames from "clsx";
import { useRetryableSWR } from "lib/swr";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { TZStatsOperation, getAccountWithOperations } from "lib/tzstats";
import { useReadyThanos } from "lib/thanos/front";
import InUSD from "app/templates/InUSD";
import Identicon from "app/atoms/Identicon";
import HashChip from "app/atoms/HashChip";
import Money from "app/atoms/Money";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";

interface OperationHistoryProps {
  accountPkh: string;
}

let initialLoad = true;

const OperationHistory: React.FC<OperationHistoryProps> = ({ accountPkh }) => {
  const { network } = useReadyThanos();

  const fetchOperations = React.useCallback(async () => {
    if (initialLoad) {
      await new Promise(res => setTimeout(res, 200));
      initialLoad = false;
    }
    try {
      return await getAccountWithOperations(network.tzStats, {
        pkh: accountPkh,
        order: "desc",
        limit: 25,
        offset: 0
      }).then(acc => acc.ops);
    } catch (err) {
      // Human delay
      await new Promise(r => setTimeout(r, 300));

      if (err?.origin?.response?.status === 404) {
        return [];
      }
      throw err;
    }
  }, [network.tzStats, accountPkh]);

  const { data } = useRetryableSWR(
    ["operation-history", network.tzStats, accountPkh],
    fetchOperations,
    {
      suspense: true,
      refreshInterval: 10_000
    }
  );
  const operations = data!;

  const onlyUniqueOps = React.useMemo(() => {
    const unique: TZStatsOperation[] = [];
    for (const op of operations) {
      if (unique.every(u => opKey(u) !== opKey(op))) {
        unique.push(op);
      }
    }
    return unique;
  }, [operations]);

  return (
    <div
      className={classNames("mt-8", "w-full max-w-md mx-auto", "flex flex-col")}
    >
      {onlyUniqueOps.length === 0 && (
        <div
          className={classNames(
            "mb-12",
            "flex flex-col items-center justify-center",
            "text-gray-500"
          )}
        >
          <LayersIcon className="mb-2 w-16 h-auto stroke-current" />

          <h3 className="text-sm font-light">No operations found</h3>
        </div>
      )}

      {onlyUniqueOps.map(op => (
        <Operation key={opKey(op)} accountPkh={accountPkh} {...op} />
      ))}
    </div>
  );
};

export default OperationHistory;

type OperationProps = TZStatsOperation & {
  accountPkh: string;
};

const Operation = React.memo<OperationProps>(
  ({ accountPkh, hash, type, receiver, volume, status, time }) => {
    const volumeExists = volume !== 0;
    const typeTx = type === "transaction";
    const imReceiver = receiver === accountPkh;
    const pending = status === "backtracked";

    return (
      <div className={classNames("my-3", "flex items-strech")}>
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

          <div className="flex items-strech">
            <div className="flex flex-col">
              <span className="mt-1 text-blue-600 opacity-75">
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
                        addSuffix: true
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
                          return imReceiver ? "text-green-500" : "text-red-700";

                        default:
                          return "text-gray-800";
                      }
                    })()
                  )}
                >
                  {typeTx && (imReceiver ? "+" : "-")}
                  <Money>{volume}</Money> ꜩ
                </div>

                <InUSD volume={volume}>
                  {usdVolume => (
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
    .map(w => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
    .join(" ");
}

function opKey(op: TZStatsOperation) {
  return `${op.hash}_${op.type}`;
}
