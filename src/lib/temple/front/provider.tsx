import React, { FC, useMemo } from 'react';

import { ShortcutAccountSelectStateProvider } from 'app/hooks/use-account-select-shortcut';
import { AssetsFilterOptionsStateProvider } from 'app/hooks/use-assets-filter-options-state';
import { ManageAssetsStateProvider } from 'app/hooks/use-manage-assets-state';
import { usePushNotifications } from 'app/hooks/use-push-notifications';
import { CustomTezosChainIdContext } from 'lib/analytics';
import { ReadyTempleProvider } from 'temple/front/ready';

import { TempleClientProvider, useTempleClient } from './client';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => {
  usePushNotifications();

  return (
    <CustomTezosChainIdContext.Provider value={undefined}>
      <TempleClientProvider>
        <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
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
          <ManageAssetsStateProvider>
            <AssetsFilterOptionsStateProvider>
              <ShortcutAccountSelectStateProvider>{children}</ShortcutAccountSelectStateProvider>
            </AssetsFilterOptionsStateProvider>
          </ManageAssetsStateProvider>
        </ReadyTempleProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
