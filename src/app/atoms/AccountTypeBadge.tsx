import React, { memo } from "react";

import classNames from "clsx";

import { getAccountBadgeTitle } from "app/defaults";
import { TempleAccount } from "lib/temple/front";

type AccountTypeBadgeProps = {
  account: Pick<TempleAccount, "type">;
  darkTheme?: boolean;
};

const AccountTypeBadge = memo<AccountTypeBadgeProps>(
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
