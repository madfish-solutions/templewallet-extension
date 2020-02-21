import * as React from "react";
import classNames from "clsx";
import { TZStatsNetwork, getAccountOperations } from "lib/TZStatsApi";

enum FieldName {
  total_balance = "Total Balance",
  spendable_balance = "Spendable Balance",
  rich_rank = "Rank",
  total_received = "Total received",
  total_sent = "Total sent",
  n_tx = "Transactions",
  n_ops = "Operations",
  active_delegations = "Active delegations",
  rolls = "Rolls owned",
  first_seen = "Creation Date",
  last_seen = "Last Active",
  total_fees_paid = "Total Fees Paid"
}

const ExploreAccount: React.FC<any> = ({ ownMnemonic, title }) => {
  const [network, setNetwork] = React.useState(TZStatsNetwork.Mainnet);
  const [publicKeyHash, setPublicKeyHash] = React.useState(
    "tz1W1f1JrE7VsqgpUpj1iiDobqP5TixgZhDk"
  );

  const [account, setAccount] = React.useState({ ops: [] });

  React.useEffect(() => {
    (async () => {
      const fetchAccountOperations = await getAccountOperations(network, {
        publicKeyHash
      });
      setAccount(fetchAccountOperations);
      console.log(fetchAccountOperations, "acc");
    })();
  }, []);

  return (
    <div className="py-4">
      <h1
        className={classNames(
          "mb-2",
          "text-2xl font-light text-gray-700 text-center"
        )}
      >
        {title}
      </h1>

      <hr className="my-4" />
      <div className="flex flex-wrap">
        {Object.keys(FieldName).map((field: string, key: number) => (
          <Card value={account[field]} title={FieldName[field]} key={key} />
        ))}
      </div>
      <hr className="my-4" />
      <OperationsTable operations={account.ops} />
    </div>
  );
};

const Card: React.FC<any> = ({ value, title }) => {
  return (
    <div className="w-36 m-2 p-2 border-2">
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
