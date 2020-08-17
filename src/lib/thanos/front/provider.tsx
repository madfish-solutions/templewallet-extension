import * as React from "react";
import { ThanosClientProvider, useThanosClient } from "lib/thanos/front/client";
import { ReadyThanosProvider } from "lib/thanos/front/ready";
import { USDPriceProvider } from "lib/thanos/front/usdprice";
import { NewBlockTriggersProvider } from "lib/thanos/front/chain";

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
