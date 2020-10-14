import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { T } from "lib/ui/i18n";
import { useAccount, useDelegate } from "lib/thanos/front";
import BakerBanner from "app/templates/BakerBanner";
import { ReactComponent as DiamondIcon } from "app/icons/diamond.svg";
import { ReactComponent as SupportAltIcon } from "app/icons/support-alt.svg";
import styles from "./BakingSection.module.css";

const BakingSection: React.FC = () => {
  const acc = useAccount();
  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash);

  return React.useMemo(
    () => (
      <div
        className={classNames(
          "mb-12",
          "flex flex-col items-center justify-center"
        )}
      >
        {myBakerPkh ? (
          <>
            <T id="delegatedTo">
              {(message) => (
                <p
                  className="mb-2 text-sm font-light text-center text-gray-500"
                  style={{ maxWidth: "20rem" }}
                >
                  {message}
                </p>
              )}
            </T>

            <BakerBanner bakerPkh={myBakerPkh} className="mb-6" />
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <SupportAltIcon className="w-16 h-auto mb-1 stroke-current" />

            <T id="delegatingMotivation">
              {(message) => (
                <p
                  className="mb-6 text-sm font-light text-center"
                  style={{ maxWidth: "20rem" }}
                >
                  {message}
                </p>
              )}
            </T>
          </div>
        )}

        <Link
          to="/delegate"
          className={classNames(
            "py-2 px-6 rounded",
            "border-2",
            "border-indigo-500 hover:border-indigo-600 focus:border-indigo-600",
            "bg-indigo-500 hover:bg-indigo-600",
            "flex items-center justify-center",
            "text-white",
            "text-base font-semibold",
            "transition ease-in-out duration-300",
            myBakerPkh ? "shadow-sm" : styles["delegate-button"]
          )}
          type="button"
        >
          <DiamondIcon
            className={classNames("-ml-2 mr-2", "h-5 w-auto", "stroke-current")}
          />
          <T id={myBakerPkh ? "reDelegate" : "delegateNow"} />
        </Link>
      </div>
    ),
    [myBakerPkh]
  );
};

export default BakingSection;
