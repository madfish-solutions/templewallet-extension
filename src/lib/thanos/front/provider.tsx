import * as React from "react";
import { ThanosClientProvider, useThanosClient } from "lib/thanos/front/client";
import {
  ReadyThanosProvider,
  ThanosRefsProvider,
} from "lib/thanos/front/ready";
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
          <ThanosRefsProvider>
            <USDPriceProvider>
              <NewBlockTriggersProvider>{children}</NewBlockTriggersProvider>
            </USDPriceProvider>
          </ThanosRefsProvider>
        </ReadyThanosProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
