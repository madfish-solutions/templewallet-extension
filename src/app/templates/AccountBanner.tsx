import * as React from "react";
import classNames from "clsx";
import { ThanosAccount, XTZ_ASSET } from "lib/thanos/front";
import { t } from "lib/ui/i18n";
import Balance from "app/templates/Balance";
import Money from "app/atoms/Money";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import AccountTypeBadge from "app/atoms/AccountTypeBadge";

type AccountBannerProps = React.HTMLAttributes<HTMLDivElement> & {
  account: ThanosAccount;
  displayBalance?: boolean;
  networkRpc?: string;
  label?: React.ReactNode;
  labelDescription?: React.ReactNode;
  labelIndent?: "sm" | "md";
};

const AccountBanner: React.FC<AccountBannerProps> = ({
  account,
  displayBalance = true,
  networkRpc,
  className,
  label = t("account"),
  labelIndent = "md",
  labelDescription,
}) => (
  <div className={classNames("flex flex-col", className)}>
    {(label || labelDescription) && (
      <h2
        className={classNames(
          labelIndent === "md" ? "mb-4" : "mb-2",
          "leading-tight",
          "flex flex-col"
        )}
      >
        {label && (
          <span className="text-base font-semibold text-gray-700">{label}</span>
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

      <div className="flex flex-col items-start ml-2">
        <div className="flex flex-wrap items-center">
          <Name className="text-sm font-medium leading-tight text-gray-800">
            {account.name}
          </Name>

          <AccountTypeBadge account={account} />
        </div>

        <div className="flex flex-wrap items-center mt-1">
          <div className={classNames("text-xs leading-none", "text-gray-700")}>
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

          {displayBalance && (
            <Balance address={account.publicKeyHash} networkRpc={networkRpc}>
              {(bal) => (
                <div
                  className={classNames(
                    "ml-2",
                    "text-xs leading-none",
                    "text-gray-600"
                  )}
                >
                  <Money>{bal}</Money>{" "}
                  <span style={{ fontSize: "0.75em" }}>{XTZ_ASSET.symbol}</span>
                </div>
              )}
            </Balance>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AccountBanner;
