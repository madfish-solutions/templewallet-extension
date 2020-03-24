import * as React from "react";
import classNames from "clsx";
import useSWR from "swr";
import {
  TZStatsOperation,
  OperationStatus,
  getAccountWithOperations
} from "lib/tzstats";
import { useReadyThanos } from "lib/thanos/front";
import Identicon from "app/atoms/Identicon";
import ShortAddressLabel from "app/atoms/ShortAddressLabel";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

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
        limit: 50,
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
    <div>
      <div className="flex justify-center mt-8">
        <div className="flex flex-col w-full">
          {/* {JSON.stringify(transactions)} */}
          {operations.map(op => (
            <React.Fragment key={op.hash}>
              {/* {!!i && <hr />} */}

              <Operation
                {...op}
                address="tz1MXjdb684ByEP5qUn5J7EMub7Sr8eBziDe"
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

type OperationProps = TZStatsOperation & {
  address: string;
};

const Operation = React.memo<OperationProps>(op => {
  console.info(op);
  const { address, hash, type, receiver, volume, status, time } = op;
  const isTransaction = React.useMemo(() => type === "transaction", [type]);

  const isIncoming = React.useMemo(() => {
    return receiver === address;
  }, [address, receiver]);

  return (
    <div className="flex content-center my-3">
      <div className="mr-3">
        <Identicon hash={hash} size={50} />
      </div>
      <div className="flex-1">
        <div className="flex">
          <div>
            <ShortAddressLabel small address={hash} />
          </div>
          <div className="flex-1">
            <div
              className={classNames(
                "flex flex-col justify-center flex-shrink-0 items-end",
                isTransaction &&
                  (isIncoming ? "text-red-700" : "text-green-500")
              )}
            >
              <div className="text-sm">
                {isTransaction && (isIncoming ? "-" : "+")}
                {round(volume, 4)} ꜩ
              </div>
              <div className="text-xs">
                {isTransaction && (isIncoming ? "-" : "+")}
                <span className={!isTransaction ? "invisible " : ""}>
                  300 $
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex">
          <StatusChip status={status} className="mr-2" />
          <span className="text-blue-600 opacity-75 mr-2">{type}</span>
          <Time
            children={() => (
              <span className="text-gray-600">
                {formatDistanceToNow(new Date(time))}
              </span>
            )}
          />
        </div>
      </div>
    </div>
  );
});

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

interface StatusChipProps {
  status: OperationStatus;
  className?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const [extraClasses, statusName] = React.useMemo<[string, string]>(() => {
    switch (status) {
      case "backtracked":
        return ["bg-yellow-100 text-yellow-600", "In Progress"];
      case "applied":
        return ["bg-green-100 text-green-600", "Applied"];
      case "failed":
        return ["bg-red-100 text-red-600", "Failed"];
      case "skipped":
        return ["bg-red-100 text-red-600", "Skipped"];
    }
  }, [status]);

  return (
    <Chip className={classNames(extraClasses, className)}>{statusName}</Chip>
  );
};

const Chip: React.FC<{ className?: string }> = ({ children, className }) => (
  <div
    className={classNames(
      "rounded-sm shadow-xs",
      "text-xs p-1",
      "leading-none select-none",
      className
    )}
  >
    {children}
  </div>
);

function round(val: number, decPlaces: any = 4) {
  return Number(`${Math.round(+`${val}e${decPlaces}`)}e-${decPlaces}`);
}

export default OperationHistory;
