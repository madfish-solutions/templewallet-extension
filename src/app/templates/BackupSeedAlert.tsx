import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { useThanosClient } from "lib/thanos/front";
import { ReactComponent as HistoryIcon } from "app/icons/history.svg";

const BackupSeedPhrase: React.FC = () => {
  const { ready, seedRevealed } = useThanosClient();

  return ready && !seedRevealed ? (
    <div className="fixed bottom-0 w-full z-50">
      <div className="block w-full max-w-screen-sm mx-auto p-4">
        <Link
          to="/settings/reveal-seed-phrase"
          className={classNames(
            "block rounded-full",
            "transition ease-in-out duration-300",
            "bg-yellow-500",
            "shadow-sm hover:shadow",
            "p-2",
            "flex items-center",
            "text-yellow-100 leading-none"
          )}
          role="alert"
        >
          <span
            className={classNames(
              "mr-3",
              "rounded-full",
              "bg-yellow-400",
              "px-1 py-1",
              "flex items-center",
              "uppercase text-sm font-bold"
            )}
          >
            <HistoryIcon className="stroke-current stroke-2 h-4 w-auto" />
          </span>

          <span className="mr-2 flex-auto text-left font-semibold">
            Make sure to back up your seed phrase!
          </span>

          <svg
            className="fill-current opacity-75 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z" />
          </svg>
        </Link>
      </div>
    </div>
  ) : null;
};

export default BackupSeedPhrase;
