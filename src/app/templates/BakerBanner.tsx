import React, { HTMLAttributes, memo, useMemo } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";

import Identicon from "app/atoms/Identicon";
import Money from "app/atoms/Money";
import Name from "app/atoms/Name";
import AddressChip from "app/pages/Explore/AddressChip";
import { toLocalFormat } from "lib/i18n/numbers";
import { T } from "lib/i18n/react";
import {
  useRelevantAccounts,
  useAccount,
  useKnownBaker,
} from "lib/temple/front";

type BakerBannerProps = HTMLAttributes<HTMLDivElement> & {
  bakerPkh: string;
  displayAddress?: boolean;
};

const BakerBanner = memo<BakerBannerProps>(
  ({ bakerPkh, displayAddress = true, className, style }) => {
    const allAccounts = useRelevantAccounts();
    const account = useAccount();
    const { data: baker } = useKnownBaker(bakerPkh);
    const assetSymbol = "tez";

    const bakerAcc = useMemo(
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

              <div className="flex flex-col items-start flex-1 ml-2">
                <div
                  className={classNames(
                    "w-full",
                    "flex flex-wrap items-center",
                    "leading-none"
                  )}
                  style={{ marginBottom: "0.125rem" }}
                >
                  <Name className="pb-1 mr-1 text-lg font-medium">
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
                    <AddressChip pkh={baker.address} small />
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
                      <T id="fee" />:{" "}
                      <span className="font-normal">
                        {toLocalFormat(new BigNumber(baker.fee).times(100), {
                          decimalPlaces: 2,
                        })}
                        %
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
                      <T id="space" />:{" "}
                      <span className="font-normal">
                        <Money>{baker.freespace}</Money>
                      </span>{" "}
                      <span style={{ fontSize: "0.75em" }}>{assetSymbol}</span>
                    </div>
                  </div>
                </div>

                <T id="exploreMore">
                  {(message) => (
                    <a
                      href={exploreBakerUrl(baker.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classNames(
                        "flex items-center",
                        "text-xs text-blue-600 hover:underline"
                      )}
                    >
                      {message}
                    </a>
                  )}
                </T>
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

            <div className="flex flex-col items-start flex-1 ml-2">
              <div
                className={classNames(
                  "mb-px w-full",
                  "flex flex-wrap items-center",
                  "leading-none"
                )}
              >
                <Name className="pb-1 mr-1 text-lg font-medium">
                  {bakerAcc ? (
                    <>
                      {bakerAcc.name}
                      {bakerAcc.publicKeyHash === account.publicKeyHash && (
                        <T id="selfComment">
                          {(message) => (
                            <>
                              {" "}
                              <span className="font-light opacity-75">
                                {message}
                              </span>
                            </>
                          )}
                        </T>
                      )}
                    </>
                  ) : (
                    <T id="unknownBakerTitle">
                      {(message) => (
                        <span className="font-normal">
                          {typeof message === "string"
                            ? message.toLowerCase()
                            : message}
                        </span>
                      )}
                    </T>
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
                  <AddressChip pkh={bakerPkh} small />
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
