import * as React from "react";
import classNames from "clsx";
import useSWR from "swr";
import { TZStatsNetwork, getAccountOperations } from "lib/tzstats";
import Identicon from "app/atoms/Identicon";
import ShortAddressLabel from "app/atoms/ShortAddressLabel";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

const fetchAccountOperations = (
  network: TZStatsNetwork,
  publicKeyHash: string
) => getAccountOperations(network, { publicKeyHash });

interface OperationHistoryProps {
  address: string;
}

enum TransactionSide {
  Incoming,
  Outcoming
}

type OperationStatus = "applied" | "failed" | "backtracked" | "skipped";

type Operation = {
  row_id: number;
  type: string;
  hash: string;
  sender: string | null;
  receiver: string | null;
  delegate: string | null;
  is_success: number;
  status: OperationStatus;
  time: number;
  volume: number;
  fee: number;
  burned: number;
  height: number;
  reward: number;
  side?: TransactionSide;
  source?: string | null;
};

let initialLoad = true;

const OperationHistory: React.FC<OperationHistoryProps> = ({ address }) => {
  const network = React.useMemo(() => TZStatsNetwork.Mainnet, []);
  const fetchOperations = React.useCallback<typeof fetchAccountOperations>(
    async (network, address) => {
      if (initialLoad) {
        await new Promise(res => setTimeout(res, 200));
        initialLoad = false;
      }
      return fetchAccountOperations(network, address);
    },
    []
  );
  const { data } = useSWR([network, address], fetchOperations, {
    suspense: true
  });
  const operations = (data?.ops as Operation[]) || [];

  return (
    <div>
      <div className="flex justify-center mt-8">
        <div className="flex flex-col w-full">
          {/* {JSON.stringify(transactions)} */}
          {operations.map((operation, i) => (
            <>
              {!!i && <hr />}
              <Operation operation={operation} address={address} key={i} />
            </>
          ))}
        </div>
      </div>
    </div>
  );
};

const Operation: React.FC<{ operation: Operation; address: string }> = ({
  operation,
  address
}) => {
  const isTransaction = React.useMemo(() => operation.type === "transaction", [
    operation.type
  ]);

  const isIncoming = React.useMemo(() => {
    return operation.receiver === address;
  }, [address, operation.receiver]);

  return (
    <div className="flex content-center my-3">
      <div className="mr-3">
        <Identicon hash={operation.hash} size={50} />
      </div>
      <div className="flex-1">
        <div className="flex">
          <div>
            <ShortAddressLabel small address={operation.hash} />
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
                {round(operation.volume, 4)} ꜩ
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
          <StatusChip status={operation.status} className="mr-2" />
          <span className="text-blue-600 opacity-75 mr-2">
            {operation.type}
          </span>
          <Time
            children={() => (
              <span className="text-gray-600">
                {formatDistanceToNow(new Date(operation.time))}
              </span>
            )}
          />
        </div>
      </div>
    </div>
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
