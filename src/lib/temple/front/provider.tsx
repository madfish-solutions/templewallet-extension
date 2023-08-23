import React, { FC, useMemo } from 'react';

import { usePushNotifications } from 'app/hooks/use-push-notifications';
import { CustomRpcContext } from 'lib/analytics';

import { useUserAnalyticsAndAdsSettings } from '../../../app/hooks/use-user-analytics-and-ads-settings.hook';
import { NewBlockTriggersProvider } from './chain';
import { TempleClientProvider, useTempleClient } from './client';
import { ReadyTempleProvider, useNetwork } from './ready';
import { SyncTokensProvider } from './sync-tokens';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => {
  usePushNotifications();
  useUserAnalyticsAndAdsSettings();

  return (
    <CustomRpcContext.Provider value={undefined}>
      <TempleClientProvider>
        <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
      </TempleClientProvider>
    </CustomRpcContext.Provider>
  );
};

const ConditionalReadyTemple: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useTempleClient();

  return useMemo(
    () =>
      ready ? (
        <ReadyTempleProvider>
          <WalletRpcProvider>
            <SyncTokensProvider>
              <NewBlockTriggersProvider>{children}</NewBlockTriggersProvider>
            </SyncTokensProvider>
          </WalletRpcProvider>
        </ReadyTempleProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};

const WalletRpcProvider: FC<PropsWithChildren> = ({ children }) => {
  const network = useNetwork();

  return <CustomRpcContext.Provider value={network.rpcBaseURL}>{children}</CustomRpcContext.Provider>;
};
