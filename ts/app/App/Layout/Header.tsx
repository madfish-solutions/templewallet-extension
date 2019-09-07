import * as React from "react";
import classNames from "clsx";
import WidthContainer from "lib/layouts/WidthContainer";
import SelectNetworkDropdown from "./Header/SelectNetworkDropdown";

interface HeaderProps {
  popup?: boolean;
}

const Header: React.FC<HeaderProps> = ({ popup }) => (
  <header className={classNames("bg-orange-500", !popup && "pb-24 -mb-20")}>
    <WidthContainer
      as="nav"
      className="flex items-center justify-between flex-wrap py-6"
    >
      <div className="flex items-center flex-shrink-0 text-white mr-6">
        <svg
          className="fill-current h-8 w-8 mr-2"
          width="54"
          height="54"
          viewBox="0 0 54 54"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13.5 22.1c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05zM0 38.3c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05z" />
        </svg>
        {!popup && (
          <span className="font-semibold text-xl tracking-tight">Thanos</span>
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
    </WidthContainer>
  </header>
);

export default Header;
