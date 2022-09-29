import React, { FC, useMemo } from 'react';

import { CustomRpsContext } from 'lib/analytics';
import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { PropsWithChildren } from 'lib/props-with-children';

import { TokensMetadataProvider } from './assets';
import { NewBlockTriggersProvider } from './chain';
import { TempleClientProvider, useTempleClient } from './client';
import { ReadyTempleProvider, useNetwork } from './ready';
import { SyncTokensProvider } from './sync-tokens';
import { USDPriceProvider } from './usdprice';

export const TempleProvider: FC<PropsWithChildren> = ({ children }) => (
  <CustomRpsContext.Provider value={undefined}>
    <TempleClientProvider>
      <ConditionalReadyTemple>{children}</ConditionalReadyTemple>
    </TempleClientProvider>
  </CustomRpsContext.Provider>
);

const ConditionalReadyTemple: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useTempleClient();

  return useMemo(
    () =>
      ready ? (
        <ReadyTempleProvider>
          <WalletRpcProvider>
            <TokensMetadataProvider>
              <USDPriceProvider>
                <FiatCurrencyProvider>
                  <SyncTokensProvider>
                    <NewBlockTriggersProvider>{children}</NewBlockTriggersProvider>
                  </SyncTokensProvider>
                </FiatCurrencyProvider>
              </USDPriceProvider>
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

  return <CustomRpsContext.Provider value={network.rpcBaseURL}>{children}</CustomRpsContext.Provider>;
};
