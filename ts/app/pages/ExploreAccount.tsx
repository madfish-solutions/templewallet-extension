import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
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
    <img src={getAvatarUrl(props.source)} alt="" width="36px" height="36px" />
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

const RefreshButton: React.FC<any> = ({ fetching, ...rest }) => (
  <svg
    width={32}
    height={32}
    viewBox="0 0 24 24"
    aria-labelledby="rotateIconTitle"
    stroke="#a0aec0"
    strokeLinecap="round"
    fill="none"
    color="#a0aec0"
    className={fetching ? "spin" : ""}
    {...rest}
  >
    <title>{"Rotate"}</title>
    <path d="M22 12l-3 3-3-3M2 12l3-3 3 3" />
    <path d="M19.016 14v-1.95A7.05 7.05 0 008 6.22M16.016 17.845A7.05 7.05 0 015 12.015V10M5 10V9M19 15v-1" />
  </svg>
);

const ExploreAccount: React.FC = () => {
  const [fetching, setFetching] = React.useState(false);
  const [balance, setBalance] = React.useState(0);
  const [transactions, setTransactions] = React.useState<Array<any>>([]);
  const { getTotalBalance, getTransactions } = useThanosSDKContext();
  const {
    logout,
    keystore,
    activated,
    activating,
    activateAcc
  }: any = useThanosContext();

  async function refreshData() {
    if (fetching) return;

    try {
      setFetching(true);
      const address = keystore.publicKeyHash;
      const { sum_balance } = (await getTotalBalance(address))[0];
      const txs = await getTransactions(address);
      setFetching(false);
      setBalance(sum_balance / 10 ** 6);
      setTransactions(mapTransactions(txs, address));
    } catch (_) {
      setFetching(false);
      setBalance(0);
      setTransactions([]);
    }
  }

  const handleSignOutClick = React.useCallback(() => {
    logout();
  }, [logout]);

  const handleRefreshClick = React.useCallback(refreshData, [refreshData]);

  React.useEffect(() => {
    if (keystore) {
      refreshData();
    }
  }, []);

  return (
    <>
      <div className="bg-gray-100 px-8 py-4 -mt-8 -mx-8 mb-4 flex items-center">
        <div className="text-base text-gray-800 flex items-center">
          {(() => {
            if (activating) {
              return "Loading activation...";
            }

            if (!activated) {
              return (
                <>
                  <span className="mr-2 w-2 h-2 rounded-full border border-white bg-yellow-600" />
                  <span>Not Activated</span>
                  <button
                    className="ml-2 text-blue-600 underline"
                    onClick={activateAcc}
                  >
                    Activate?
                  </button>
                </>
              );
            }

            return (
              <>
                <span className="mr-2 w-2 h-2 rounded-full border border-white bg-green-600" />
                <span>Activated</span>
              </>
            );
          })()}
        </div>
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
        <h3 className="text-xl font-thin text-gray-800">Balance:</h3>
        <h3 className="text-3xl font-thin text-gray-800">
          <b>{round(balance, 4)}</b> ꜩ
        </h3>
        <div className="text-xl mb-4 font-light text-gray-500 flex content-center">
          <span style={{ lineHeight: "36px" }}>
            ${round(balance * 1.06, 2)}
          </span>
          <button
            type="button"
            onClick={handleRefreshClick}
            className="rounded focus:outline-none focus:shadow-outline inline ml-4"
          >
            <RefreshButton fetching={fetching} />
          </button>
        </div>
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
            {transactions.map((tx, i) => (
              <Transaction {...tx} key={i} />
            ))}
          </div>
        </form>
      </div>
    </>
  );
};

export default ExploreAccount;

function getAvatarUrl(id: string | number, type: string = "jdenticon") {
  return `https://avatars.dicebear.com/v2/${type}/${id}.svg`;
}
