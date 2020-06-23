import * as React from "react";
import { ThanosClientProvider, useThanosClient } from "lib/thanos/front/client";
import { ReadyThanosProvider } from "lib/thanos/front/ready";
import { USDPriceProvider } from "lib/thanos/front/usdprice";
import { NewBlockTriggersProvider } from "lib/thanos/front/chain";

export * from "lib/thanos/types";
export * from "lib/thanos/helpers";
export * from "lib/thanos/assets";
export * from "lib/thanos/contract";
export * from "lib/thanos/front/storage";
export * from "lib/thanos/front/client";
export * from "lib/thanos/front/ready";
export * from "lib/thanos/front/usdprice";
export * from "lib/thanos/front/chain";
export * from "lib/thanos/front/balance";
export * from "lib/thanos/front/baking";
export * from "lib/thanos/front/pndops";
export * from "lib/thanos/front/tokens";
export * from "lib/thanos/front/assets";

export const ThanosProvider: React.FC = ({ children }) => (
  <ThanosClientProvider>
    <ConditionalReadyThanos>{children}</ConditionalReadyThanos>
  </ThanosClientProvider>
);

const ConditionalReadyThanos: React.FC = ({ children }) => {
  const { ready } = useThanosClient();

  return React.useMemo(
    () =>
      ready ? (
        <ReadyThanosProvider>
          <USDPriceProvider>
            <NewBlockTriggersProvider>{children}</NewBlockTriggersProvider>
          </USDPriceProvider>
        </ReadyThanosProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
