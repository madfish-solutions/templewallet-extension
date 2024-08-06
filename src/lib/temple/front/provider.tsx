import React, { FC, useMemo, useState } from 'react';

import { ShortcutAccountSelectStateProvider } from 'app/hooks/use-account-select-shortcut';
import { AssetsViewStateProvider } from 'app/hooks/use-assets-view-state';
import { usePushNotifications } from 'app/hooks/use-push-notifications';
import { CustomTezosChainIdContext } from 'lib/analytics';
import { ReadyTempleProvider } from 'temple/front/ready';

import { TempleClientProvider, useTempleClient } from './client';
import { SuccessfulImportToastContext } from './successful-import-toast-context';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => {
  usePushNotifications();
  const importToastState = useState(false);

  return (
    <CustomTezosChainIdContext.Provider value={undefined}>
      <TempleClientProvider>
        <SuccessfulImportToastContext.Provider value={importToastState}>
          <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
        </SuccessfulImportToastContext.Provider>
      </TempleClientProvider>
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
