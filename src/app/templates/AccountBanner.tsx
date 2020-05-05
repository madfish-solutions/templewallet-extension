import * as React from "react";
import classNames from "clsx";
import { ThanosAccount, ThanosAccountType } from "lib/thanos/front";
import Balance from "app/templates/Balance";
import Money from "app/atoms/Money";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";

type AccountBannerProps = React.HTMLAttributes<HTMLDivElement> & {
  account: ThanosAccount;
  label?: React.ReactNode;
  labelDescription?: React.ReactNode;
};

const AccountBanner: React.FC<AccountBannerProps> = ({
  account,
  className,
  label = "Account",
  labelDescription,
}) => {
  const assetSymbol = "XTZ";

  return (
    <div className={classNames("flex flex-col", className)}>
      {(label || labelDescription) && (
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          {label && (
            <span className="text-base font-semibold text-gray-700">
              {label}
            </span>
          )}

          {labelDescription && (
            <span
              className={classNames("mt-1", "text-xs font-light text-gray-600")}
              style={{ maxWidth: "90%" }}
            >
              {labelDescription}
            </span>
          )}
        </h2>
      )}

      <div
        className={classNames(
          "w-full",
          "border rounded-md",
          "p-2",
          "flex items-center"
        )}
      >
        <Identicon
          type="bottts"
          hash={account.publicKeyHash}
          size={32}
          className="flex-shrink-0 shadow-xs"
        />

        <div className="ml-2 flex flex-col items-start">
          <div className="flex flex-wrap items-center">
            <Name className="text-sm font-medium leading-tight text-gray-800">
              {account.name}
            </Name>

            {account.type === ThanosAccountType.Imported && (
              <span
                className={classNames(
                  "ml-2",
                  "rounded-sm",
                  "border border-black-25",
                  "px-1 py-px",
                  "leading-tight",
                  "text-black-50"
                )}
                style={{ fontSize: "0.6rem" }}
              >
                Imported
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center">
            <div
              className={classNames("text-xs leading-none", "text-gray-700")}
            >
              {(() => {
                const val = account.publicKeyHash;
                const ln = val.length;
                return (
                  <>
                    {val.slice(0, 7)}
                    <span className="opacity-75">...</span>
                    {val.slice(ln - 4, ln)}
                  </>
                );
              })()}
            </div>

            <Balance address={account.publicKeyHash}>
              {(bal) => (
                <div
                  className={classNames(
                    "ml-2",
                    "text-xs leading-none",
                    "text-gray-600"
                  )}
                >
                  <Money>{bal}</Money>{" "}
                  <span style={{ fontSize: "0.75em" }}>{assetSymbol}</span>
                </div>
              )}
            </Balance>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountBanner;
