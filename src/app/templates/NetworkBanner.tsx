import * as React from "react";
import classNames from "clsx";
import { useAllNetworks } from "lib/thanos/front";

const NetworkBanner: React.FC<{ rpc: string }> = ({ rpc }) => {
  const allNetworks = useAllNetworks();
  const knownNetwork = React.useMemo(
    () => allNetworks.find((n) => n.rpcBaseURL === rpc),
    [allNetworks, rpc]
  );

  return (
    <div className={classNames("w-full", "mb-4", "flex flex-col")}>
      <h2 className={classNames("leading-tight", "flex flex-col")}>
        <span className="mb-2 text-base font-semibold text-gray-700">
          Network
        </span>

        <div className={classNames("mb-1", "flex items-center")}>
          <div
            className={classNames(
              "mr-1 w-3 h-3",
              "border border-primary-white",
              "rounded-full",
              "shadow-xs"
            )}
            style={{
              backgroundColor: knownNetwork ? knownNetwork.color : "#000",
            }}
          />

          <span className="text-gray-700 text-sm">
            {knownNetwork ? knownNetwork.name : "Unknown"}
          </span>
        </div>

        {/* <div className="my-1">
                <div className={classNames("mb-1", "flex items-center")}>
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

                  <span className="text-gray-700 text-sm flex items-center">
                    Custom (<Name>{net.name!}</Name>)
                  </span>
                </div>

                <Name
                  className="text-xs font-mono italic"
                  style={{ maxWidth: "100%" }}
                >
                  {net.rpcUrl!}
                </Name>
              </div> */}
      </h2>
    </div>
  );
};

export default NetworkBanner;
