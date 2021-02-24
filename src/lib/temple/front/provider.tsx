import * as React from "react";
import { TempleClientProvider, useTempleClient } from "lib/temple/front/client";
import {
  ReadyTempleProvider,
  TempleRefsProvider,
} from "lib/temple/front/ready";
import { USDPriceProvider } from "lib/temple/front/usdprice";
import { NewBlockTriggersProvider } from "lib/temple/front/chain";
import { useAssets } from "lib/temple/front/assets";

export const TempleProvider: React.FC = ({ children }) => (
  <TempleClientProvider>
    <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
  </TempleClientProvider>
);

const ConditionalReadyTemple: React.FC = ({ children }) => {
  const { ready } = useTempleClient();

  return React.useMemo(
    () =>
      ready ? (
        <ReadyTempleProvider>
          <TempleRefsProvider>
            <USDPriceProvider>
              <NewBlockTriggersProvider>
                <PreloadAssetsProvider>{children}</PreloadAssetsProvider>
              </NewBlockTriggersProvider>
            </USDPriceProvider>
          </TempleRefsProvider>
        </ReadyTempleProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};

const PreloadAssetsProvider: React.FC = ({ children }) => {
  useAssets();
  return <>{children}</>;
};
