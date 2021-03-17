import React, { FC, useMemo } from "react";

import { useAssets } from "lib/temple/front/assets";
import { NewBlockTriggersProvider } from "lib/temple/front/chain";
import { TempleClientProvider, useTempleClient } from "lib/temple/front/client";
import {
  ReadyTempleProvider,
  TempleRefsProvider,
} from "lib/temple/front/ready";
import { USDPriceProvider } from "lib/temple/front/usdprice";

export const TempleProvider: FC = ({ children }) => (
  <TempleClientProvider>
    <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
  </TempleClientProvider>
);

const ConditionalReadyTemple: FC = ({ children }) => {
  const { ready } = useTempleClient();

  return useMemo(
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

const PreloadAssetsProvider: FC = ({ children }) => {
  useAssets();
  return <>{children}</>;
};
