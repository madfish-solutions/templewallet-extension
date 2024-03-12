import React, { FC, useMemo } from 'react';

import { ShortcutAccountSelectStateProvider } from 'app/hooks/use-account-select-shortcut';
import { usePushNotifications } from 'app/hooks/use-push-notifications';
import { CustomRpcContext } from 'lib/analytics';
import { useTezosNetwork } from 'temple/hooks';

import { NewBlockTriggersProvider } from './chain';
import { TempleClientProvider, useTempleClient } from './client';
import { ReadyTempleProvider } from './ready';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => {
  usePushNotifications();

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
            <NewBlockTriggersProvider>
              <ShortcutAccountSelectStateProvider>{children}</ShortcutAccountSelectStateProvider>
            </NewBlockTriggersProvider>
          </WalletRpcProvider>
        </ReadyTempleProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};

/**
 * TODO: Why do we need this?
 *
 * Note: Didn't have suspense here before. Hint: Have a `useTezosRpcUrl()` */
const WalletRpcProvider: FC<PropsWithChildren> = ({ children }) => {
  const { rpcUrl } = useTezosNetwork();

  return <CustomRpcContext.Provider value={rpcUrl}>{children}</CustomRpcContext.Provider>;
};
