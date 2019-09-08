import * as React from "react";
import classNames from "clsx";
import { Link } from "react-router-dom";
import jdenticon from "jdenticon";
import useThanosSDKContext from "lib/useThanosSDKContext";
import useThanosContext from "lib/useThanosContext";

enum TransactionSide {
  Outcoming = "To",
  Incoming = "From"
}

const round = (val: number, decPlaces: any = 4): number =>
  Number(`${Math.round(+`${val}e${decPlaces}`)}e-${decPlaces}`);

const mapTransactions = (txs: Array<any>, address: string): Array<any> => {
  return txs.map(tx => ({
    ...tx,
    side:
      tx.source === address
        ? TransactionSide.Outcoming
        : TransactionSide.Incoming
  }));
};

const Transaction: React.FC = (props: any) => (
  <div
    className="flex justify-between content-center mb-2"
    style={{ height: "36px" }}
  >
    <img
      src={URL.createObjectURL(
        new Blob([jdenticon.toSvg(props.source, 36)], { type: "image/svg+xml" })
      )}
      width="36px"
      height="36px"
    />
    <div
      style={{ lineHeight: "36px" }}
      className="text-gray-400 text-base truncate px-2"
    >
      {props.side}: {props.source}
    </div>
    <div
      style={{ lineHeight: "36px" }}
      className={classNames(
        "flex-shrink-0 text-lg",
        props.side === TransactionSide.Outcoming
          ? "text-red-700"
          : "text-green-500"
      )}
    >
      {props.side === TransactionSide.Outcoming ? "-" : "+"}{" "}
      {round(props.amount / 10 ** 6, 4)} ꜩ
    </div>
  </div>
);

const ExploreAccount: React.FC = () => {
  const [balance, setBalance] = React.useState(0);
  const [transactions, setTransactions] = React.useState<Array<any>>([]);
  const { getTotalBalance, getTransactions } = useThanosSDKContext();
  const { logout, keystore }: any = useThanosContext();

  const handleSignOutClick = React.useCallback(() => {
    logout();
  }, [logout]);

  React.useEffect(() => {
    if (keystore) {
      const address = keystore.publicKeyHash;

      (async () => {
        try {
          const { sum_balance } = (await getTotalBalance(address))[0];
          const txs = await getTransactions(address);
          setBalance(sum_balance / 10 ** 6);
          setTransactions(mapTransactions(txs, address));
        } catch (_) {
          setBalance(0);
          setTransactions([]);
        }
      })();
    }
  }, []);

  console.log(transactions);

  return (
    <>
      <div className="bg-gray-100 px-8 py-4 -mt-8 -mx-8 mb-4 flex items-center">
        <div className="flex-1" />
        <button
          className="border-2 border-gray-600 hover:border-gray-700 text-gray-600 hover:text-gray-700 text-sm font-semibold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={handleSignOutClick}
        >
          Sign out
        </button>
      </div>
      <div className="flex flex-col items-center text-center">
        <h1 className="text-3xl mb-4 text-gray-800">Explore Account</h1>
        <img
          src="../misc/tezoslogo.png"
          width="80px"
          height="80px"
          className="mb-4"
        />
        <h3 className="text-3xl font-thin text-gray-800">
          Balance: <b>{round(balance, 4)}</b> ꜩ
        </h3>
        <h4 className="text-xl mb-4 font-light text-gray-500">
          ${round(balance * 1.06, 2)}
        </h4>
      </div>

      <div className="flex justify-center max-w-sm mx-auto">
        <Link to="/account/transfer">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white text-base font-bold mr-2 py-2 px-6 rounded focus:outline-none focus:shadow-outline w-full"
            type="button"
          >
            Send
          </button>
        </Link>
        <Link to="/account/receive">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white text-base font-bold ml-2 py-2 px-6 rounded focus:outline-none focus:shadow-outline w-full"
            type="button"
          >
            Receive
          </button>
        </Link>
      </div>

      <div className="flex justify-center mt-8">
        <form className="w-full max-w-sm">
          <h3 className="text-lg text-gray-500 mb-4">Transaction History</h3>
          <div className="flex flex-col">
            {transactions.map(tx => (
              <Transaction {...tx} key={tx.counter} />
            ))}
          </div>
        </form>
      </div>
    </>
  );
};

export default ExploreAccount;
