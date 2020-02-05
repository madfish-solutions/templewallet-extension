import * as React from "react";
import classNames from "clsx";
import { WindowType, useAppEnvContext } from "app/env";
import ContentContainer from "app/layout/ContentContainer";
import SelectNetworkDropdown from "./Header/SelectNetworkDropdown";

const Header: React.FC = () => {
  const { windowType } = useAppEnvContext();
  const fullPageWindow = windowType === WindowType.FullPage;

  return (
    <header
      className={classNames("bg-orange-500", fullPageWindow && "pb-24 -mb-20")}
    >
      <ContentContainer className="flex items-center justify-between flex-wrap py-6">
        <div className="flex items-center flex-shrink-0 text-white mr-6">
          <img src="../misc/icon.png" alt="" width="36" height="36" />
          {fullPageWindow && (
            <span className="font-semibold ml-2 text-xl tracking-tight">
              Thanos
            </span>
          )}
        </div>
        <div className="flex flex-grow items-center w-auto">
          {/* <div className="text-sm flex-grow">
            <a
              href="#kek"
              className="inline-block mt-0 text-indigo-200 hover:text-white mr-4"
            >
              Dice Game
            </a>
          </div> */}
          <div className="flex-grow" />
          <div>
            <SelectNetworkDropdown />
          </div>
        </div>
      </ContentContainer>
    </header>
  );
};

export default Header;
