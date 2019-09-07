import * as React from "react";
import classNames from "clsx";
import { Link } from "persist/location";
import WidthContainer from "app/layouts/WidthContainer";

const PageHeader: React.FC = () => {
  const [mobileMenuOpened, setMobileMenuOpened] = React.useState(false);

  const handleMobileMenuClick = React.useCallback(() => {
    setMobileMenuOpened(opened => !opened);
  }, [setMobileMenuOpened]);

  return (
    <header className="bg-indigo-800">
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
          <span className="font-semibold text-xl tracking-tight">Gambling</span>
        </div>
        <div className="block lg:hidden">
          <button
            className="flex items-center px-3 py-2 border rounded text-indigo-200 border-indigo-400 hover:text-white hover:border-white"
            onClick={handleMobileMenuClick}
          >
            <svg
              className="fill-current h-3 w-3"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
            </svg>
          </button>
        </div>
        <div
          className={classNames(
            "w-full",
            mobileMenuOpened ? "block" : "hidden lg:block",
            "flex-grow lg:flex lg:items-center lg:w-auto"
          )}
        >
          <div className="text-sm lg:flex-grow">
            <Link
              to="/game/dice"
              className="block mt-4 lg:inline-block lg:mt-0 text-indigo-200 hover:text-white mr-4"
            >
              Dice Game
            </Link>
            <Link
              to="/game"
              className="block mt-4 lg:inline-block lg:mt-0 text-indigo-200 hover:text-white mr-4"
            >
              Redirect to Home
            </Link>
            <Link
              to={{
                pathname: "/kek",
                search: "?wow=mom",
                hash: "#kek"
              }}
              className="block mt-4 lg:inline-block lg:mt-0 text-indigo-200 hover:text-white"
            >
              Not Found
            </Link>
          </div>
        </div>
      </WidthContainer>
    </header>
  );
};

export default PageHeader;
