import * as React from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import { Link } from "lib/woozie";
import { useRetryableSWR } from "lib/swr";
import { useAccount, useTezos, useKnownBaker } from "lib/thanos/front";
import Name from "app/atoms/Name";
import Money from "app/atoms/Money";
import { ReactComponent as DiamondIcon } from "app/icons/diamond.svg";
import { ReactComponent as SupportAltIcon } from "app/icons/support-alt.svg";
import styles from "./BakingSection.module.css";

const BakingSection: React.FC = () => {
  const acc = useAccount();
  const tezos = useTezos();

  const getDelegate = React.useCallback(async () => {
    try {
      return await tezos.rpc.getDelegate(acc.publicKeyHash);
    } catch (err) {
      if (err.status === 404) {
        return null;
      }

      throw err;
    }
  }, [tezos, acc.publicKeyHash]);

  const { data: myBakerPkh } = useRetryableSWR(
    ["delegate", tezos.checksum, acc.publicKeyHash],
    getDelegate,
    {
      refreshInterval: 120_000,
      dedupingInterval: 60_000,
      suspense: true,
    }
  );

  return React.useMemo(
    () => (
      <div
        className={classNames(
          "mb-12",
          "flex flex-col items-center justify-center"
        )}
      >
        {myBakerPkh ? (
          <BakerBanner bakerPkh={myBakerPkh} />
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <SupportAltIcon className="mb-1 w-16 h-auto stroke-current" />

            <p
              className="mb-6 text-sm font-light text-center"
              style={{ maxWidth: "20rem" }}
            >
              Delegating your funds to bakers is a great way of earning interest
              on your balance.{" "}
            </p>
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
          Delegate {myBakerPkh ? "new" : "now"}
        </Link>
      </div>
    ),
    [myBakerPkh]
  );
};

export default BakingSection;

type BakerBannerProps = {
  bakerPkh: string;
};

const BakerBanner = React.memo<BakerBannerProps>(({ bakerPkh }) => {
  const baker = useKnownBaker(bakerPkh, true);
  const assetSymbol = "XTZ";

  return baker ? (
    <div className={classNames("mb-4 p-4 flex items-stretch", "text-gray-700")}>
      <div>
        <img
          src={baker.logo}
          alt={baker.name}
          className={classNames(
            "flex-shrink-0",
            "w-10 h-auto",
            "bg-white rounded shadow-xs"
          )}
        />
      </div>

      <div className="ml-2 flex flex-col items-start">
        <div
          className={classNames(
            "mb-px",
            "flex flex-wrap items-center",
            "leading-noneleading-none"
          )}
        >
          <Name className="text-base font-medium pb-1">{baker.name}</Name>

          <span className={classNames("ml-2", "text-xs text-black-50 pb-px")}>
            {baker.lifetime} cycles
          </span>
        </div>

        <div
          className={classNames("mb-1 pl-px", "flex flex-wrap items-center")}
        >
          <div
            className={classNames(
              "text-xs font-light leading-none",
              "text-gray-600"
            )}
          >
            Fee:{" "}
            <span className="font-normal">
              {new BigNumber(baker.fee).times(100).toFormat(2)}%
            </span>
          </div>
        </div>

        <div className="pl-px flex flex-wrap items-center">
          <div
            className={classNames(
              "text-xs font-light leading-none",
              "text-gray-600"
            )}
          >
            Space:{" "}
            <span className="font-normal">
              <Money>{baker.freespace}</Money>
            </span>{" "}
            <span style={{ fontSize: "0.75em" }}>{assetSymbol}</span>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div
      className={classNames("p-4", "flex flex-col items-center", "text-center")}
    >
      Unknow baker:
      <br />
      {bakerPkh}
    </div>
  );
});
