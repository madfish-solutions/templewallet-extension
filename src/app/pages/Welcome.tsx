import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import Logo from "app/atoms/Logo";
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
    description: (
      <>
        Already have a seed phrase? Import your existing wallet using a 12 or
        more mnemonic words
      </>
    ),
  },
  {
    key: "create",
    linkTo: "/create-wallet",
    filled: true,
    Icon: FolderAddIcon,
    title: "Create a new Wallet",
    description: (
      <>
        New to Thanos Wallet? Let’s set it up! This will create a new wallet
        and seed phrase
      </>
    ),
  },
];

const Welcome: React.FC = () => {
  return (
    <div
      className={classNames(
        "min-h-screen",
        "w-full max-w-screen-md mx-auto",
        "px-4",
        "flex flex-col items-center justify-center"
      )}
    >
      <div
        className={classNames("-mt-32", "text-2xl text-gray-700 font-light")}
      >
        Welcome to
      </div>

      <div className="flex items-center mb-8">
        <Logo />

        <h1
          className={classNames("ml-2", "text-3xl text-gray-700 font-semibold")}
        >
          Thanos Wallet
        </h1>
      </div>

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
                    "px-10 py-4",
                    "flex flex-col",
                    filled
                      ? "text-white"
                      : "shadow-inner bg-primary-orange-lighter text-primary-orange",
                    "text-shadow-black-orange"
                  )}
                >
                  <div
                    className={classNames(
                      "flex-1",
                      "flex flex-col items-center justify-end"
                    )}
                  >
                    <Icon className="transform scale-125 stroke-current" />
                  </div>

                  <h1 className="pb-1 text-xl font-semibold text-center">
                    {title}
                  </h1>

                  <div className="flex-1">
                    <p
                      className={classNames(
                        "my-1 text-center",
                        "text-xs",
                        filled
                          ? "text-primary-orange-lighter"
                          : "text-primary-orange"
                      )}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Welcome;
