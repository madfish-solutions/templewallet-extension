import * as React from "react";
import classNames from "clsx";
import useSWR from "swr";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { TZStatsOperation, getAccountWithOperations } from "lib/tzstats";
import { ThanosNetworkType } from "lib/thanos/types";
import { useReadyThanos } from "lib/thanos/front";
import Identicon from "app/atoms/Identicon";
import HashChip from "app/atoms/HashChip";

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
      if (err?.origin?.response?.status === 404) {
        return [];
      }
      throw err;
    }
  }, [network.tzStats, accountPkh]);

  const { data } = useSWR(
    ["operation-history", network.tzStats, accountPkh],
    fetchOperations,
    {
      suspense: true,
      refreshInterval: 10_000
    }
  );
  const operations = data!;

  return (
    <div className={classNames("mt-8", "flex flex-col")}>
      {operations.map(op => (
        <Operation
          key={`${op.hash}_${op.type}`}
          {...op}
          address={accountPkh}
          networkType={network.type}
        />
      ))}
    </div>
  );
};

export default OperationHistory;

type OperationProps = TZStatsOperation & {
  address: string;
  networkType: ThanosNetworkType;
};

const Operation = React.memo<OperationProps>(
  ({ networkType, address, hash, type, receiver, volume, status, time }) => {
    const volumeExists = volume !== 0;
    const typeTx = type === "transaction";
    const imReceiver = receiver === address;

    return (
      <div className={classNames("my-3", "flex items-strech")}>
        <div className="mr-2">
          <Identicon hash={hash} size={50} className="shadow-xs" />
        </div>

        <div className="flex-1">
          <div className="flex items-center">
            <HashChip
              address={hash}
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

              {status === "backtracked" ? (
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
                    typeTx
                      ? imReceiver
                        ? "text-green-500"
                        : "text-red-700"
                      : "text-gray-800"
                  )}
                >
                  {typeTx && (imReceiver ? "+" : "-")}
                  {round(volume, 4)} ꜩ
                </div>

                {networkType === ThanosNetworkType.Main && (
                  <div className="text-xs text-gray-500">
                    <span className="mr-px">$</span>
                    {round(volume * 1.65, 2)}
                  </div>
                )}
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

function round(val: number, decPlaces: any = 4) {
  return Number(`${Math.round(+`${val}e${decPlaces}`)}e-${decPlaces}`);
}

function formatOperationType(type: string, imReciever: boolean) {
  if (type === "transaction") {
    type = `${imReciever ? "↓" : "↑"}_${type}`;
  }

  return type
    .split("_")
    .map(w => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
    .join(" ");
}

// interface StatusChipProps {
//   status: OperationStatus;
//   className?: string;
// }

// const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
//   const [extraClasses, statusName] = React.useMemo<[string, string]>(() => {
//     switch (status) {
//       case "backtracked":
//         return ["bg-yellow-100 text-yellow-600", "In Progress"];
//       case "applied":
//         return ["bg-green-100 text-green-600", "Applied"];
//       case "failed":
//         return ["bg-red-100 text-red-600", "Failed"];
//       case "skipped":
//         return ["bg-red-100 text-red-600", "Skipped"];
//     }
//   }, [status]);

//   return (
//     <Chip className={classNames(extraClasses, className)}>{statusName}</Chip>
//   );
// };

// const Chip: React.FC<{ className?: string }> = ({ children, className }) => (
//   <div
//     className={classNames(
//       "rounded-sm shadow-xs",
//       "text-xs p-1",
//       "leading-none select-none",
//       className
//     )}
//   >
//     {children}
//   </div>
// );
