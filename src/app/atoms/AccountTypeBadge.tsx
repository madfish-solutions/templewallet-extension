import * as React from "react";
import classNames from "clsx";
import { ThanosAccount, ThanosAccountType } from "lib/thanos/front";

type AccountTypeBadgeProps = {
  account: ThanosAccount;
  darkTheme?: boolean;
};

const AccountTypeBadge = React.memo<AccountTypeBadgeProps>(
  ({ account, darkTheme = false }) => {
    if (account.type === ThanosAccountType.HD) return null;

    return (
      <span
        className={classNames(
          "ml-2",
          "rounded-sm",
          "border border-opacity-25",
          "px-1 py-px",
          "leading-tight",
          "text-opacity-50",
          darkTheme ? "border-white text-white" : "border-black text-black"
        )}
        style={{ fontSize: "0.6rem" }}
      >
        {(() => {
          switch (account.type) {
            case ThanosAccountType.Imported:
              return "Imported";

            case ThanosAccountType.Ledger:
              return "Ledger";
          }
        })()}
      </span>
    );
  }
);

export default AccountTypeBadge;
