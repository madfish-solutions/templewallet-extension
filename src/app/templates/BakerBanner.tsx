import React, { HTMLAttributes, memo, useMemo } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";

import Identicon from "app/atoms/Identicon";
import Money from "app/atoms/Money";
import Name from "app/atoms/Name";
import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import AddressChip from "app/pages/Explore/AddressChip";
import HashChip from "app/templates/HashChip";
import { toLocalFormat } from "lib/i18n/numbers";
import { T } from "lib/i18n/react";
import {
  useRelevantAccounts,
  useAccount,
  useKnownBaker,
  useExplorerBaseUrls,
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
    const { account: accountBaseUrl } = useExplorerBaseUrls();
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
                    "w-8 h-auto",
                    "bg-white rounded shadow-xs"
                  )}
                  style={{
                    minHeight: "2rem",
                  }}
                />
              </div>

              <div className="flex flex-col items-start flex-1 ml-2">
                <div
                  className={classNames(
                    "w-full mb-1 mr-1 text-lg",
                    "flex flex-wrap items-center",
                    "leading-none"
                  )}
                >
                  <Name>{baker.name}</Name>
                </div>

                {displayAddress && (
                  <div className="mb-1 flex flex-wrap items-center">
                    <HashChip
                      bgShade={200}
                      rounded="base"
                      className="mr-1"
                      hash={baker.address}
                      small
                      textShade={700}
                    />
                    {accountBaseUrl && (
                      <OpenInExplorerChip
                        bgShade={200}
                        textShade={500}
                        rounded="base"
                        hash={baker.address}
                        baseUrl={accountBaseUrl}
                      />
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center">
                  <div className="mr-2 flex items-center">
                    <div
                      className={classNames(
                        "text-xs font-light leading-tight",
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

                  <div className="flex items-center">
                    <div
                      className={classNames(
                        "text-xs font-light leading-tight",
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
