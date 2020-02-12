import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import ContentContainer from "app/layout/ContentContainer";
import { ReactComponent as EntranceIcon } from "app/icons/entrance.svg";
import { ReactComponent as FolderAddIcon } from "app/icons/folder-add.svg";

const SIGNS = [
  {
    key: "import",
    linkTo: "/import-wallet",
    filled: false,
    Icon: ({
      className,
      ...rest
    }: React.ComponentProps<typeof EntranceIcon>) => (
      <EntranceIcon
        className={classNames("transform rotate-90", className)}
        {...rest}
      />
    ),
    title: "Import existing Wallet",
    description: "Import your existing wallet using a 12 word seed phrase"
  },
  {
    key: "create",
    linkTo: "/create-wallet",
    filled: true,
    Icon: FolderAddIcon,
    title: "Create a new Wallet",
    description: "This will create a new wallet and seed phrase"
  }
];

const Welcome: React.FC = () => {
  return (
    <ContentContainer
      className={classNames(
        "min-h-screen",
        "flex flex-col items-center justify-center"
      )}
    >
      <h1 className="my-4 text-4xl text-gray-700 font-light">
        Welcome to Thanos Wallet
      </h1>

      <div className={classNames("w-full", "my-4", "flex items-stretch")}>
        {SIGNS.map(({ key, linkTo, filled, Icon, title, description }) => (
          <div key={key} className={classNames("w-1/2", "p-4")}>
            <Link
              to={linkTo}
              className={classNames(
                "relative block",
                "w-full pb-2/3",
                "bg-primary-orange",
                "overflow-hidden rounded-lg",
                "transition duration-300 ease-in-out",
                "transform hover:scale-110 focus:scale-110",
                "shadow-md hover:shadow-lg focus:shadow-lg"
              )}
            >
              <div className={classNames("absolute inset-0", "p-1")}>
                <div
                  className={classNames(
                    "w-full h-full",
                    "overflow-hidden rounded-md",
                    "p-4",
                    "flex flex-col items-center justify-center",
                    filled
                      ? "text-white"
                      : "shadow-inner bg-primary-orange-lighter text-primary-orange"
                  )}
                >
                  <Icon className="pb-2 stroke-current transform scale-150" />

                  <h1 className="pb-1 text-center text-xl font-semibold">
                    {title}
                  </h1>
                  <p className="text-center opacity-75">{description}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </ContentContainer>
  );
};

export default Welcome;
