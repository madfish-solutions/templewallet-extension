import * as React from "react";
import classNames from "clsx";
import useSWR from "swr";
import { Link } from "lib/woozie";
import { useThanosWalletContext } from "lib/thanos-wallet";

const ExploreAccount: React.FC = () => {
  const {
    account: maybeAccount,
    destroyAccount,
    getBalance
  } = useThanosWalletContext();
  const account = maybeAccount!;

  const fetchAccountData = React.useCallback(
    async (address: string) => {
      const [balance, transactions] = await Promise.all([
        getBalance(address),
        fetchAllAccountOperations(address)
      ]);

      return { balance, transactions };
    },
    [getBalance]
  );

  const accountSWR = useSWR(account.address, fetchAccountData, {
    suspense: true
  });

  const handleRefreshClick = React.useCallback(() => {
    accountSWR.revalidate();
  }, [accountSWR]);

  const handleSignOutClick = React.useCallback(() => {
    destroyAccount();
  }, [destroyAccount]);

  const balance = accountSWR.data!.balance;
  const transactions = accountSWR.data!.transactions;

  return (
    <>
      <div className="bg-gray-100 px-8 py-4 -mt-8 -mx-8 mb-4 flex items-center">
        <div className="text-base text-gray-800 flex items-center">
          {(() => {
            // if (activating) {
            //   return "Loading activation...";
            // }

            // if (!activated) {
            //   return (
            //     <>
            //       <span className="mr-2 w-2 h-2 rounded-full border border-white bg-yellow-600" />
            //       <span>Not Activated</span>
            //       <button
            //         className="ml-2 text-blue-600 underline"
            //         onClick={activateAcc}
            //       >
            //         Activate?
            //       </button>
            //     </>
            //   );
            // }

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
          alt=""
          width="80px"
          height="80px"
          className="mb-4"
        />
        <h3 className="text-xl font-thin text-gray-800">Balance:</h3>
        <h3 className="text-3xl font-thin text-gray-800">
          <b>{round(+balance, 4)}</b> ꜩ
        </h3>
        <div className="text-xl mb-4 font-light text-gray-500 flex content-center">
          <span style={{ lineHeight: "36px" }}>
            ${round(+balance * 1.06, 2)}
          </span>
          <button
            type="button"
            onClick={handleRefreshClick}
            className="rounded focus:outline-none focus:shadow-outline inline ml-4"
          >
            <RefreshButton fetching={accountSWR.isValidating} />
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
            {/* {JSON.stringify(transactions)} */}
            {transactions.map((operation, i) => (
              <Transaction operation={operation} key={i} />
            ))}
          </div>
        </form>
      </div>
    </>
  );
};

export default ExploreAccount;

enum TransactionSide {
  Incoming,
  Outcoming
}

type Operation = {
  row_id: number;
  type: string;
  hash: string;
  sender: string | null;
  receiver: string | null;
  delegate: string | null;
  is_success: number;
  time: number;
  volume: number;
  fee: number;
  burned: number;
  height: number;
  reward: number;
  side?: TransactionSide;
  source?: string | null;
};

const Transaction: React.FC<{ operation: Operation }> = ({ operation }) => (
  <div
    className="flex justify-between content-center mb-2"
    style={{ height: "36px" }}
  >
    <img
      src={getAvatarUrl(operation.source!)}
      alt=""
      width="36px"
      height="36px"
    />
    <div
      style={{ lineHeight: "36px" }}
      className="text-gray-400 text-base truncate px-2"
    >
      {operation.side!}: {operation.source!}
    </div>
    <div
      style={{ lineHeight: "36px" }}
      className={classNames(
        "flex-shrink-0 text-lg",
        operation.side! === TransactionSide.Outcoming
          ? "text-red-700"
          : "text-green-500"
      )}
    >
      {operation.side! === TransactionSide.Outcoming ? "-" : "+"}{" "}
      {round(operation.volume, 4)} ꜩ
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

function round(val: number, decPlaces: any = 4) {
  return Number(`${Math.round(+`${val}e${decPlaces}`)}e-${decPlaces}`);
}

function getAvatarUrl(id: string | number, type: string = "jdenticon") {
  return `https://avatars.dicebear.com/v2/${type}/${id}.svg`;
}

async function fetchAllAccountOperations(address: string) {
  const [inOps, outOps] = await Promise.all([
    fetchAccountOperations(address, "receiver"),
    fetchAccountOperations(address, "sender")
  ]);

  [
    { ops: inOps, side: TransactionSide.Incoming },
    { ops: outOps, side: TransactionSide.Outcoming }
  ].forEach(({ ops, side }) => {
    for (const op of ops) {
      op.side = side;
      op.source = side === TransactionSide.Incoming ? op.sender : op.receiver;
    }
  });

  return inOps
    .concat(outOps)
    .sort((a, b) => b.time - a.time)
    .filter(o => o.type === "transaction");
}

async function fetchAccountOperations(
  address: string,
  direction: "receiver" | "sender"
) {
  const columns = [
    "row_id",
    "type",
    "hash",
    "sender",
    "receiver",
    "delegate",
    "is_success",
    "time",
    "volume",
    "fee",
    "burned",
    "height",
    "reward"
  ];
  const url = [
    "https://api.babylonnet.tzstats.com",
    "/tables/op",
    `?${direction}=${address}`,
    "&order=desc",
    `&columns=${columns.join(",")}`,
    "&limit=100"
  ].join("");

  const res = await fetch(url);
  if (res.ok) {
    const ops = await res.json();
    return ops.map((op: any[]) =>
      op.reduce((opObj, val, i) => ({ ...opObj, [columns[i]]: val }), {})
    ) as Operation[];
  } else {
    throw new Error(res.statusText);
  }
}
