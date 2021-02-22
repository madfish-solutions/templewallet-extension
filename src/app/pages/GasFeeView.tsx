import React from "react";
import BigNumber from "bignumber.js";
import { mutezToTz, USDPriceProvider, useAllNetworks } from "lib/thanos/front";
import { T } from "lib/i18n/react";
import Alert from "app/atoms/Alert";
import Spinner from "app/atoms/Spinner";
import InUSD from "app/templates/InUSD";

type GasFeeViewProps = {
  fee?: number;
  error?: Error;
  loading?: boolean;
  networkRpc: string;
};

const GasFeeView: React.FC<GasFeeViewProps> = ({
  fee,
  error,
  loading,
  networkRpc,
}) => {
  const allNetworks = useAllNetworks();
  const knownNetwork = React.useMemo(
    () => allNetworks.find((n) => n.rpcBaseURL === networkRpc),
    [allNetworks, networkRpc]
  );

  return (
    <USDPriceProvider network={knownNetwork}>
      {error ? (
        <Alert
          className="mt-2"
          type="warn"
          title="Gas fee estimation error"
          description={error.message}
        />
      ) : (
        fee !== undefined && (
          <div className="w-full bg-gray-100 text-gray-700 text-sm p-2 mt-2">
            <T
              id="totalFee"
              substitutions={[
                <React.Fragment key={0}>
                  {mutezToTz(fee).toString()} ꜩ
                  {knownNetwork?.type === "main" && (
                    <>
                      {" "}
                      <InUSD
                        volume={mutezToTz(fee)}
                        roundingMode={BigNumber.ROUND_FLOOR}
                      >
                        {(usdAmount) => <>($ {usdAmount})</>}
                      </InUSD>
                    </>
                  )}
                </React.Fragment>,
              ]}
            />
          </div>
        )
      )}
      {loading && (
        <div className="w-full flex justify-center p-2">
          <Spinner className="w-16" />
        </div>
      )}
    </USDPriceProvider>
  );
};

export default GasFeeView;
