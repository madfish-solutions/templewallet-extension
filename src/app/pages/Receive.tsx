import * as React from "react";
import classNames from "clsx";
import { QRCode } from "react-qr-svg";
import { useNetwork, useAccount } from "lib/thanos/front";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import { ReactComponent as QRIcon } from "app/icons/qr.svg";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";
import { ReactComponent as FaucetIcon } from "app/misc/faucet.svg";
import { ReactComponent as ExchangeIcon } from "app/misc/exchange.svg";
import Name from "app/atoms/Name";
import SubTitle from "app/atoms/SubTitle";

const ALL_DEPOSITS = [
  {
    networkType: "main",
    type: "exchange",
    title: "Use CoinSwitch",
    link: "https://coinswitch.thanoswallet.com/",
    icon: <ExchangeIcon />,
    color: "",
  },
  {
    networkType: "main",
    type: "faucet",
    title: "Tezos Faucet",
    link: "https://faucet.tezos.com/",
    icon: <FaucetIcon />,
    color: "",
  },
  {
    networkType: "test",
    type: "faucet",
    title: "Tezos Faucet (Alpha)",
    link: "https://faucet.tzalpha.net/",
    icon: <FaucetIcon />,
    color: "",
  },
];

const Receive: React.FC = () => {
  const network = useNetwork();
  const account = useAccount();
  const address = account.publicKeyHash;

  const deposits = React.useMemo(() => {
    return ALL_DEPOSITS.length
      ? ALL_DEPOSITS.filter(d => d.networkType === network.type)
      : [];
  }, [network.type]);

  const { fieldRef, copy, copied } = useCopyToClipboard();

  return (
    <PageLayout
      pageTitle={
        <>
          <QRIcon className="mr-1 h-4 w-auto stroke-current" />
          Receive
        </>
      }
    >
      <div className="py-4">
        <div className={classNames("w-full max-w-sm mx-auto")}>
          <FormField
            textarea
            rows={2}
            ref={fieldRef}
            id="receive-address"
            label="Address"
            labelDescription={
              <>Your current account address. Share it to receive funds.</>
            }
            value={address}
            size={36}
            spellCheck={false}
            readOnly
            style={{
              resize: "none",
            }}
          />

          <button
            type="button"
            className={classNames(
              "mx-auto mb-6",
              "py-1 px-2 w-40",
              "bg-primary-orange rounded",
              "border border-primary-orange",
              "flex items-center justify-center",
              "text-primary-orange-lighter text-shadow-black-orange",
              "text-sm font-semibold",
              "transition duration-300 ease-in-out",
              "opacity-90 hover:opacity-100 focus:opacity-100",
              "shadow-sm",
              "hover:shadow focus:shadow"
            )}
            onClick={copy}
          >
            {copied ? (
              "Copied."
            ) : (
              <>
                <CopyIcon
                  className={classNames(
                    "mr-1",
                    "h-4 w-auto",
                    "stroke-current stroke-2"
                  )}
                />
                Copy to clipboard
              </>
            )}
          </button>

          <div className="flex flex-col items-center">
            <div className="mb-2 text-center leading-tight">
              <span className="text-sm font-semibold text-gray-700">
                QRCode
              </span>
            </div>

            <div
              className="p-1 bg-gray-100 border-2 border-gray-300 rounded"
              style={{ maxWidth: "60%" }}
            >
              <QRCode
                bgColor="#f7fafc"
                fgColor="#000000"
                level="Q"
                style={{ width: "100%" }}
                value={address}
              />
            </div>
            {deposits.length && (
              <div className="my-6 w-full">
                <h2
                  className={classNames(
                    "mb-4",
                    "leading-tight",
                    "flex flex-col"
                  )}
                >
                  <span className="text-base font-semibold text-gray-700">
                    Deposit to your wallet
                  </span>

                  <span
                    className={classNames(
                      "mt-1",
                      "text-xs font-light text-gray-600"
                    )}
                    style={{ maxWidth: "90%" }}
                  >
                    Click on deposit method to get money on your wallet. Use
                    faucet to get free coins!
                  </span>
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
                        "flex items-strech",
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
                          <Name className="text-base font-medium pb-1">
                            {d.title}
                          </Name>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Receive;
