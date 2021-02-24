import * as React from "react";
import classNames from "clsx";
import { TempleAccount } from "lib/temple/front";
import { getAccountBadgeTitle } from "app/defaults";

type AccountTypeBadgeProps = {
  account: Pick<TempleAccount, "type">;
  darkTheme?: boolean;
};

const AccountTypeBadge = React.memo<AccountTypeBadgeProps>(
  ({ account, darkTheme = false }) => {
    const title = getAccountBadgeTitle(account);

    return title ? (
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
        {title}
      </span>
    ) : null;
  }
);

export default AccountTypeBadge;
