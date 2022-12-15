import React, { FC, useMemo } from 'react';

import { CustomRpcContext } from 'lib/analytics';

import { TokensMetadataProvider } from './assets';
import { NewBlockTriggersProvider } from './chain';
import { TempleClientProvider, useTempleClient } from './client';
import { ReadyTempleProvider, useNetwork } from './ready';
import { SyncBalancesProvider } from './sync-balances';
import { SyncTokensProvider } from './sync-tokens';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => (
  <CustomRpcContext.Provider value={undefined}>
    <TempleClientProvider>
      <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
    </TempleClientProvider>
  </CustomRpcContext.Provider>
);

const ConditionalReadyTemple: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useTempleClient();

  return useMemo(
    () =>
      ready ? (
        <ReadyTempleProvider>
          <WalletRpcProvider>
            <TokensMetadataProvider>
              <SyncTokensProvider>
                <SyncBalancesProvider>
                  <NewBlockTriggersProvider>{children}</NewBlockTriggersProvider>
                </SyncBalancesProvider>
              </SyncTokensProvider>
            </TokensMetadataProvider>
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
