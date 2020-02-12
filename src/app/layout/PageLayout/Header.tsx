import * as React from "react";
import classNames from "clsx";
import { useThanosFrontContext } from "lib/thanos/front";
import { WindowType, useAppEnvContext } from "app/env";
import ContentContainer from "app/layout/ContentContainer";
import styles from "./Header.module.css";
import SelectNetworkDropdown from "./Header/SelectNetworkDropdown";

const Header: React.FC = () => {
  const { windowType } = useAppEnvContext();
  const fullPageWindow = windowType === WindowType.FullPage;

  const thanosFront = useThanosFrontContext();

  return (
    <header
      className={classNames(
        "bg-primary-orange",
        styles["inner-shadow"],
        fullPageWindow && "pb-24 -mb-20"
      )}
    >
      <ContentContainer className={classNames("py-6", "flex items-center")}>
        <div className="flex items-center flex-shrink-0 text-white mr-6">
          <img src="../misc/icon.png" alt="" width="36" height="36" />
          {fullPageWindow && (
            <span className="font-semibold ml-2 text-xl tracking-tight">
              Thanos
            </span>
          )}
        </div>

        <div className="flex-1" />

        {thanosFront.authorized && <SelectNetworkDropdown />}
      </ContentContainer>
    </header>
  );
};

export default Header;
