import React, { FC, useMemo } from 'react';

import { ShortcutAccountSelectStateProvider } from 'app/hooks/use-account-select-shortcut';
import { AssetsViewStateProvider } from 'app/hooks/use-assets-view-state';
import { usePushNotifications } from 'app/hooks/use-push-notifications';
import { CustomEvmChainIdContext, CustomTezosChainIdContext } from 'lib/analytics';
import { ReadyTempleProvider } from 'temple/front/ready';

import { TempleClientProvider, useTempleClient } from './client';
import { ToastsContextProvider } from './toasts-context';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => {
  usePushNotifications();

  return (
    <CustomTezosChainIdContext.Provider value={undefined}>
      <CustomEvmChainIdContext.Provider value={undefined}>
        <TempleClientProvider>
          <ToastsContextProvider>
            <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
          </ToastsContextProvider>
        </TempleClientProvider>
      </CustomEvmChainIdContext.Provider>
    </CustomTezosChainIdContext.Provider>
  );
};

const ConditionalReadyTemple: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useTempleClient();

  return useMemo(
    () =>
      ready ? (
        <ReadyTempleProvider>
          <AssetsViewStateProvider>
            <ShortcutAccountSelectStateProvider>{children}</ShortcutAccountSelectStateProvider>
          </AssetsViewStateProvider>
        </ReadyTempleProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
