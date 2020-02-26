import * as React from "react";
import useSWR from "swr";
import classNames from "clsx";
import { TZStatsNetwork, getAccountOperations } from "lib/TZStatsApi";

const ACCOUNT_FIELDS = [
  {
    key: "total_balance",
    title: "Total Balance"
  },
  {
    key: "spendable_balance",
    title: "Spendable Balance"
  },
  {
    key: "rich_rank",
    title: "Rank"
  },
  {
    key: "total_received",
    title: "Total received"
  },
  {
    key: "total_sent",
    title: "Total sent"
  },
  {
    key: "n_tx",
    title: "Transactions"
  },
  {
    key: "n_ops",
    title: "Operations"
  },
  {
    key: "active_delegations",
    title: "Active delegations"
  },
  {
    key: "rolls",
    title: "Rolls owned"
  },
  {
    key: "first_seen",
    title: "Creation Date"
  },
  {
    key: "last_seen",
    title: "Last Active"
  },
  {
    key: "total_fees_paid",
    title: "Total Fees Paid"
  }
];

const fetchAccountOperations = (
  network: TZStatsNetwork,
  publicKeyHash: string
) => getAccountOperations(network, { publicKeyHash });

const ExploreAccount: React.FC<any> = ({ title }) => {
  const network = React.useMemo(() => TZStatsNetwork.Mainnet, []);
  const publicKeyHash = React.useMemo(
    () => "tz1W1f1JrE7VsqgpUpj1iiDobqP5TixgZhDk",
    []
  );
  const { data } = useSWR([network, publicKeyHash], fetchAccountOperations, {
    suspense: true
  });
  const account = data!;

  return (
    <div className="py-4 max-w-full overflow-x-auto">
      <h1
        className={classNames(
          "mb-2",
          "text-2xl font-light text-gray-700 text-center"
        )}
      >
        {title}
      </h1>

      <hr className="my-4" />

      <div className="flex justify-center flex-wrap">
        {ACCOUNT_FIELDS.map(({ key, title }) => (
          <Card key={key} value={(account as any)[key]} title={title} />
        ))}
      </div>

      <hr className="my-4" />

      <OperationsTable operations={account.ops} />
    </div>
  );
};

const Card: React.FC<any> = ({ value, title }) => {
  return (
    <div className="w-48 m-2 p-2 border-2">
      <div>
        <span className="text-lg">{value}</span>
      </div>
      <div>
        <span>{title}</span>
      </div>
    </div>
  );
};

const OperationsTable: React.FC<any> = ({ operations }) => {
  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th className="px-4 py-2">No</th>
          <th className="px-4 py-2">Sender</th>
          <th className="px-4 py-2">Amount</th>
          <th className="px-4 py-2">Date</th>
          <th className="px-4 py-2">Block</th>
          <th className="px-4 py-2">Hash</th>
        </tr>
      </thead>
      <tbody>
        {operations.map(
          (
            operation: {
              sender: string;
              volume: number;
              time: Date;
              block: string;
              hash: string;
            },
            key: number
          ) => (
            <tr className="bg-gray-100" key={key}>
              <td className="border px-4 py-2 text-center"> {key + 1}</td>
              <td className="border px-4 py-2">
                <div className="w-24 truncate">{operation.sender}</div>
              </td>
              <td className="border px-4 py-2 text-center">
                {operation.volume}
              </td>
              <td className="border px-4 py-2 text-center">
                <div className="">
                  {new Date(operation.time).toLocaleString("en-US", {
                    hour12: false
                  })}
                </div>
              </td>
              <td className="max-w-xl truncate border px-4 py-2">
                <div className="w-24 truncate">{operation.block}</div>
              </td>
              <td className="max-w-xl truncate border px-4 py-2">
                <div className="w-24 truncate">{operation.hash}</div>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};

export default ExploreAccount;
