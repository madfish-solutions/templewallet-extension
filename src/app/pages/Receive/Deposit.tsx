import * as React from "react";
import classNames from "clsx";
import { useNetwork } from "lib/temple/front";
import { T } from "lib/i18n/react";
import Name from "app/atoms/Name";
import { ReactComponent as FaucetIcon } from "app/misc/faucet.svg";
import { ReactComponent as ExchangeIcon } from "app/misc/exchange.svg";

const ALL_DEPOSITS = [
  {
    networkType: "main",
    type: "exchange",
    titleName: "useCoinSwitch",
    link: "https://coinswitch.templewallet.com/",
    icon: <ExchangeIcon />,
    color: "",
  },
  {
    networkType: "main",
    type: "faucet",
    titleName: "tezosFaucet",
    link: "https://faucet.tezos.com/",
    icon: <FaucetIcon />,
    color: "",
  },
  {
    networkType: "test",
    type: "faucet",
    titleName: "tezosFaucetAlpha",
    link: "https://faucet.tzalpha.net/",
    icon: <FaucetIcon />,
    color: "",
  },
];

type DepositProps = {
  address: string;
};

const Deposit: React.FC<DepositProps> = ({ address }) => {
  const network = useNetwork();
  const deposits = React.useMemo(
    () => ALL_DEPOSITS.filter((d) => d.networkType === network.type),
    [network.type]
  );

  if (deposits.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 w-full">
      <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
        <T id="depositToWallet">
          {(message) => (
            <span className="text-base font-semibold text-gray-700">
              {message}
            </span>
          )}
        </T>

        <T id="depositToWalletDescription">
          {(message) => (
            <span
              className={classNames("mt-1", "text-xs font-light text-gray-600")}
              style={{ maxWidth: "90%" }}
            >
              {message}
            </span>
          )}
        </T>
      </h2>
      <div
        className={classNames(
          "w-full",
          "rounded-md overflow-hidden",
          "border-2 bg-gray-100",
          "flex flex-col",
          "text-gray-700 text-sm leading-tight"
        )}
      >
        {deposits.map((d, index) => (
          <a
            href={
              d.type === "exchange"
                ? `${d.link}?to=xtz&address=${address}`
                : d.link
            }
            target="_blank"
            rel="noopener noreferrer"
            key={index}
            className={classNames(
              "block w-full",
              "overflow-hidden",
              "border-b border-gray-200",
              "hover:bg-gray-200 focus:bg-gray-200",
              "flex items-stretch",
              "text-gray-700",
              "transition ease-in-out duration-200",
              "focus:outline-none",
              "opacity-90 hover:opacity-100"
            )}
            style={{
              padding: "0.65rem 0.5rem 0.65rem 0.5rem",
            }}
          >
            <div
              className={classNames(
                "flex-shrink-0",
                "w-auto h-auto",
                "rounded shadow-xs"
              )}
            >
              {d.icon}
            </div>
            <div className="ml-2 flex flex-col items-start justify-center">
              <div
                className={classNames(
                  "flex flex-wrap items-center",
                  "leading-noneleading-none"
                )}
              >
                <T id={d.titleName}>
                  {(message) => (
                    <Name className="text-base font-medium pb-1">
                      {message}
                    </Name>
                  )}
                </T>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Deposit;
