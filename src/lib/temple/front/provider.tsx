import React, { FC, useMemo, useState } from 'react';

import { ShortcutAccountSelectStateProvider } from 'app/hooks/use-account-select-shortcut';
import { AssetsViewStateProvider } from 'app/hooks/use-assets-view-state';
import { usePushNotifications } from 'app/hooks/use-push-notifications';
import { CustomEvmChainIdContext, CustomTezosChainIdContext } from 'lib/analytics';
import { ReadyTempleProvider } from 'temple/front/ready';

import { TempleClientProvider, useTempleClient } from './client';
import { SuccessfulInitToastContext } from './successful-init-toast-context';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => {
  usePushNotifications();
  const initToastState = useState<string | undefined>();

  return (
    <CustomTezosChainIdContext.Provider value={undefined}>
      <CustomEvmChainIdContext.Provider value={undefined}>
        <TempleClientProvider>
          <SuccessfulInitToastContext.Provider value={initToastState}>
            <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
          </SuccessfulInitToastContext.Provider>
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
