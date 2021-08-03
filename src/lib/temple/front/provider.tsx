import React, { FC, useMemo } from "react";

import { CustomRpsContext } from "lib/analytics";
import { TokensMetadataProvider } from "lib/temple/front/assets";
import { NewBlockTriggersProvider } from "lib/temple/front/chain";
import { TempleClientProvider, useTempleClient } from "lib/temple/front/client";
import {
  ReadyTempleProvider,
  TempleRefsProvider,
  useNetwork,
} from "lib/temple/front/ready";
import { USDPriceProvider } from "lib/temple/front/usdprice";

export const TempleProvider: FC = ({ children }) => (
  <CustomRpsContext.Provider value={undefined}>
    <TempleClientProvider>
      <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
    </TempleClientProvider>
  </CustomRpsContext.Provider>
);

const ConditionalReadyTemple: FC = ({ children }) => {
  const { ready } = useTempleClient();

  return useMemo(
    () =>
      ready ? (
        <ReadyTempleProvider>
          <WalletRpcProvider>
            <TokensMetadataProvider>
              <TempleRefsProvider>
                <USDPriceProvider>
                  <NewBlockTriggersProvider>
                    {children}
                  </NewBlockTriggersProvider>
                </USDPriceProvider>
              </TempleRefsProvider>
            </TokensMetadataProvider>
          </WalletRpcProvider>
        </ReadyTempleProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};

// const PreloadAssetsProvider: FC = ({ children }) => {
//   useAssets();
//   return <>{children}</>;
// };

const WalletRpcProvider: FC = ({ children }) => {
  const network = useNetwork();

  return (
    <CustomRpsContext.Provider value={network.rpcBaseURL}>
      {children}
    </CustomRpsContext.Provider>
  );
};
