import * as React from "react";
import classNames from "clsx";
import { useAllNetworks } from "lib/temple/front";
import { T } from "lib/i18n/react";
import Name from "app/atoms/Name";

type NetworkBannerProps = {
  rpc: string;
  narrow?: boolean;
};

const NetworkBanner: React.FC<NetworkBannerProps> = ({
  rpc,
  narrow = false,
}) => {
  const allNetworks = useAllNetworks();
  const knownNetwork = React.useMemo(
    () => allNetworks.find((n) => n.rpcBaseURL === rpc),
    [allNetworks, rpc]
  );

  return (
    <div
      className={classNames(
        "w-full",
        narrow ? "-mt-1 mb-2" : "mb-4",
        "flex flex-col"
      )}
    >
      <h2 className={classNames("leading-tight", "flex flex-col")}>
        <T id="network">
          {(message) => (
            <span
              className={classNames(
                narrow ? "mb-1" : "mb-2",
                "text-base font-semibold text-gray-700"
              )}
            >
              {message}
            </span>
          )}
        </T>

        {knownNetwork ? (
          <div className={classNames("mb-1", "flex items-center")}>
            <div
              className={classNames(
                "mr-1 w-3 h-3",
                "border border-primary-white",
                "rounded-full",
                "shadow-xs"
              )}
              style={{
                backgroundColor: knownNetwork.color,
              }}
            />

            <span className="text-gray-700 text-sm">{knownNetwork.name}</span>
          </div>
        ) : (
          <div className={classNames("w-full mb-1", "flex items-center")}>
            <div
              className={classNames(
                "flex-shrink-0",
                "mr-1 w-3 h-3",
                "bg-red-500",
                "border border-primary-white",
                "rounded-full",
                "shadow-xs"
              )}
            />

            <T id="unknownNetwork">
              {(message) => (
                <>
                  <span
                    className={classNames(
                      "flex-shrink-0 mr-2",
                      "text-xs font-medium uppercase text-red-500"
                    )}
                  >
                    {message}
                  </span>

                  <Name
                    className="text-xs font-mono italic text-gray-900"
                    style={{ maxWidth: "15rem" }}
                  >
                    {rpc}
                  </Name>
                </>
              )}
            </T>
          </div>
        )}
      </h2>
    </div>
  );
};

export default NetworkBanner;
