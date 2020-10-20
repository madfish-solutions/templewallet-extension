import * as React from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import {
  useRelevantAccounts,
  useAccount,
  useKnownBaker,
} from "lib/thanos/front";
import Name from "app/atoms/Name";
import HashChip from "app/templates/HashChip";
import Identicon from "app/atoms/Identicon";
import Money from "app/atoms/Money";

type BakerBannerProps = React.HTMLAttributes<HTMLDivElement> & {
  bakerPkh: string;
  displayAddress?: boolean;
};

const BakerBanner = React.memo<BakerBannerProps>(
  ({ bakerPkh, displayAddress = true, className, style }) => {
    const allAccounts = useRelevantAccounts();
    const account = useAccount();
    const { data: baker } = useKnownBaker(bakerPkh);
    const assetSymbol = "XTZ";

    const bakerAcc = React.useMemo(
      () => allAccounts.find((acc) => acc.publicKeyHash === bakerPkh) ?? null,
      [allAccounts, bakerPkh]
    );

    return (
      <div
        className={classNames("w-full", "border rounded-md", "p-2", className)}
        style={{ maxWidth: "17rem", ...style }}
      >
        {baker ? (
          <>
            <div className={classNames("flex items-stretch", "text-gray-700")}>
              <div>
                <img
                  src={baker.logo}
                  alt={baker.name}
                  className={classNames(
                    "flex-shrink-0",
                    "w-10 h-auto",
                    "bg-white rounded shadow-xs"
                  )}
                  style={{
                    minHeight: "2.5rem",
                  }}
                />
              </div>

              <div className="ml-2 flex-1 flex flex-col items-start">
                <div
                  className={classNames(
                    "w-full",
                    "flex flex-wrap items-center",
                    "leading-none"
                  )}
                  style={{ marginBottom: "0.125rem" }}
                >
                  <Name className="text-lg font-medium pb-1 mr-1">
                    {baker.name}
                  </Name>
                </div>

                {displayAddress && (
                  <div
                    className={classNames(
                      "mb-2 pl-px",
                      "flex flex-wrap items-center"
                    )}
                  >
                    <HashChip hash={baker.address} small />
                  </div>
                )}

                <div className="flex flex-wrap items-center">
                  <div
                    className={classNames("mr-2", "flex items-center")}
                    style={{ marginBottom: "0.125rem" }}
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

                  <div
                    className={classNames("flex items-center")}
                    style={{ marginBottom: "0.125rem" }}
                  >
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

                <a
                  href={exploreBakerUrl(baker.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classNames(
                    "flex items-center",
                    "text-xs text-blue-600 hover:underline"
                  )}
                >
                  Explore more...
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className={classNames("flex items-stretch", "text-gray-700")}>
            <div>
              <Identicon
                type="bottts"
                hash={bakerPkh}
                size={40}
                className="shadow-xs"
              />
            </div>

            <div className="ml-2 flex-1 flex flex-col items-start">
              <div
                className={classNames(
                  "mb-px w-full",
                  "flex flex-wrap items-center",
                  "leading-none"
                )}
              >
                <Name className="text-lg font-medium pb-1 mr-1">
                  {bakerAcc ? (
                    <>
                      {bakerAcc.name}
                      {bakerAcc.publicKeyHash === account.publicKeyHash && (
                        <>
                          {""}
                          <span className="font-light opacity-75">(self)</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="font-normal">unknown baker</span>
                  )}
                </Name>
              </div>

              {displayAddress && (
                <div
                  className={classNames(
                    "mb-1 pl-px",
                    "flex flex-wrap items-center"
                  )}
                >
                  <HashChip hash={bakerPkh} small />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default BakerBanner;

function exploreBakerUrl(address: string) {
  return `https://www.tezos-nodes.com/baker/${address}`;
}
